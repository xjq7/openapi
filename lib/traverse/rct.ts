import { File } from '@babel/types';
import traverse, { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import _ from 'lodash';
import * as commonParser from '../parser/common';
import { CONTROLLERS, ControllerType, IController, METHODS } from '../../types/rct';
import * as rctParser from '../parser/rct';
import { ITypeAnnotation, Route } from '../../types/openapi';
import { ParseResult } from '@babel/parser';
import * as tsParser from '../parser/ts';

type TypeType = 'plain' | 'reference';

interface TypeObj {
  name: string;
  type: TypeType;
}

interface ParamTypeObj {
  default?: TypeObj;
  name: string;
}

interface Dependence {
  parameter: ParamTypeObj[];
  type: TypeObj;
}

export default class Rct {
  private dependences: Record<string, Dependence> = {};

  private controllers: any = [];

  private collectDependence() {}

  /**
   * controller 解析
   *
   * @param {ParseResult<File>} ast
   * @memberof Rct
   */
  t_controller(ast: ParseResult<File>) {
    const _this = this;
    traverse(ast, {
      ClassDeclaration: {
        enter(path) {
          const decorators = path.node.decorators || [];
          // controller 类名
          const name = path.node.id.name;

          let comments = path.node.leadingComments;
          const parent = path.parent;
          // 带有导出语句的注释将识别为 导出语句的 comment
          if (!comments && (t.isExportNamedDeclaration(parent) || t.isExportDefaultDeclaration(parent))) {
            comments = parent.leadingComments;
          }
          const description = commonParser.comment(comments);
          const controller: IController = {
            name,
            description,
            routes: [],
            apis: [],
          };

          decorators.forEach((decorator) => {
            const { expression } = decorator;
            if (t.isCallExpression(expression)) {
              const callee = expression.callee;
              if (t.isIdentifier(callee)) {
                const calleeName = callee.name as ControllerType;
                if (CONTROLLERS.includes(calleeName)) {
                  // 接口路径解析
                  const args = expression.arguments ?? [];
                  let apiPath = '/';
                  if (args) {
                    const pathArg = args[0];
                    if (t.isStringLiteral(pathArg)) {
                      apiPath = pathArg.value || '';
                    }
                  }
                  controller.routes.push({ type: calleeName, path: apiPath });
                }
              }
            }
          });
          path.traverse({
            ClassMethod: {
              enter(path) {
                controller.apis.push(_this.t_route(path));
              },
            },
          });
          _this.controllers.push(controller);
        },
      },
    });
    console.log(JSON.stringify(_this.controllers));
  }
  /**
   * 路由方法解析
   *
   * @param {NodePath<t.ClassMethod>} path
   * @return {*}
   * @memberof Rct
   */
  t_route(path: NodePath<t.ClassMethod>) {
    const identifier = path.node.key;
    let name = '/';
    if (t.isIdentifier(identifier)) {
      name = identifier.name;
    }

    let response: ITypeAnnotation = 'any';

    let returnType = path.node.returnType;
    if (t.isTSTypeAnnotation(returnType)) {
      response = tsParser.t_TSTypeAnnotation(returnType);
    }

    const api: Route = {
      rootRoutes: [],
      description: '',
      parameters: [],
      response,
      tags: [],
      name,
    };

    const decorators = path.node.decorators || [];

    decorators.forEach((decorator) => {
      // 接口路径解析
      if (t.isCallExpression(decorator.expression)) {
        const callee = decorator.expression.callee;
        if (t.isIdentifier(callee)) {
          const calleeName = callee.name;
          if (!calleeName) return;

          let apiPath = '/';
          const args = decorator.expression.arguments;
          if (args) {
            const pathArg = args[0];
            if (t.isStringLiteral(pathArg)) {
              apiPath = pathArg.value || '';
            }
          }
          if (METHODS.includes(calleeName)) {
            api.rootRoutes.push({ method: calleeName, path: apiPath });
          }
        }
      }
    });
    api.description = commonParser.comment(path.node.leadingComments);

    // http 入参解析
    const { params } = path.node;
    params.forEach((param) => {
      if (t.isIdentifier(param)) {
        api.parameters.push(...rctParser.param(param));
      }
    });

    return api;
  }

  /**
   * 文件级别的 ast 树中提取路由信息
   *
   * @param {ParseResult<File>[]} asts
   * @memberof Rct
   */
  public traverse(asts: ParseResult<File>[]) {
    const _this = this;
    for (const ast of asts) {
      _this.t_controller(ast);
    }
  }
}

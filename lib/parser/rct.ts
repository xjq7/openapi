import { ModuleParser } from './ts';
import * as t from '@babel/types';
import traverse, { NodePath } from '@babel/traverse';
import { CONTROLLERS, ControllerType, IController, METHODS, ROUTINGPARAMS, RoutingParamType } from '../../types/rct';
import _ from 'lodash';
import * as commonParser from '../parser/common';
import { IParam, ITypeAnnotation, ParamType, Route } from '../../types/openapi';

interface ControllerProps {
  filePath: string;
  moduleParser: ModuleParser;
}

export class Controller {
  private filePath: string;
  private moduleParser: ModuleParser;

  constructor(props: ControllerProps) {
    const { filePath, moduleParser } = props;
    this.filePath = filePath;
    this.moduleParser = moduleParser;
  }

  /**
   * controller 解析
   *
   * @param {ParseResult<t.File>} ast
   * @memberof Rct
   */
  traverse() {
    const _this = this;
    const controllers: IController[] = [];

    const ast = commonParser.ASTparse(this.filePath);

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
          controllers.push(controller);
        },
      },
    });
    console.log(JSON.stringify(controllers));
  }

  /**
   * 路由方法解析
   *
   * @param {NodePath<t.ClassMethod>} path
   * @return {*}
   * @memberof Rct
   */
  t_route(path: NodePath<t.ClassMethod>) {
    const _this = this;
    const { key: identifier } = path.node;
    let { returnType } = path.node;

    let name = '/';
    if (t.isIdentifier(identifier)) {
      name = identifier.name;
    }

    let response: ITypeAnnotation = 'any';
    if (t.isTSTypeAnnotation(returnType)) {
      response = _this.moduleParser.get(this.filePath);
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
        api.parameters.push(..._this.t_param(param));
      }
    });

    return api;
  }

  /**
   * http 入参解析
   *
   * @param {t.Identifier} node
   * @return {*}
   * @memberof Rct
   */
  public t_param(node: t.Identifier) {
    const _this = this;
    const { typeAnnotation, decorators } = node;

    let type: Record<string, any> | string;
    if (t.isTSTypeAnnotation(typeAnnotation)) {
      type = this.moduleParser.t_TSTypeAnnotation(typeAnnotation.typeAnnotation);
    }

    const parameters: IParam[] = [];

    decorators?.forEach((decorator) => {
      const { expression } = decorator;

      if (t.isCallExpression(expression)) {
        const { callee, arguments: args } = expression;

        if (t.isIdentifier(callee)) {
          const name = callee.name as RoutingParamType;

          let httpType: ParamType = 'body';

          switch (name) {
            case RoutingParamType.queryParam:
              httpType = 'query';
              break;
            case RoutingParamType.bodyParam:
              httpType = 'body';
              break;
            case RoutingParamType.param:
              httpType = 'query';
              break;
            case RoutingParamType.body:
              httpType = 'body';
              break;
            default:
          }

          if (ROUTINGPARAMS.includes(name)) {
            switch (name) {
              case RoutingParamType.bodyParam:
              case RoutingParamType.queryParam:
              case RoutingParamType.param:
                const arg = args[0];
                let paramName;
                if (t.isStringLiteral(arg)) {
                  paramName = arg.value;
                  parameters.push({ type: httpType, typeAnnotation: type, name: paramName });
                }
                break;
              case RoutingParamType.body:
              case RoutingParamType.queryParams:
                Object.entries(type).forEach(([key, value]) => {
                  parameters.push({ type: httpType, typeAnnotation: value, name: key });
                });
                break;
              default:
            }
          }
        }
      }
    });
    return parameters;
  }
}

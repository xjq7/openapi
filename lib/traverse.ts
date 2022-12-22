import { NodePath, NodePathResult } from '@babel/traverse';
import * as t from '@babel/types';
import { ClassDeclaration, Decorator } from '@babel/types';
import { Api } from '../types/openapi';
import _ from 'lodash';
import { CONTROLLERS, ControllerType, IController, METHODS } from '../types/routing';
import * as parser from '../lib/parser';

export function t_controller(path: NodePath<ClassDeclaration>) {
  const decorators = path.get('decorators') as NodePathResult<Decorator[]>;
  // controller 类名
  const name = path.get('id').node.name;

  let comments = path.node.leadingComments;
  const parent = path.parent;
  // 带有导出语句的注释将识别为 导出语句的 comment
  if (!comments && (t.isExportNamedDeclaration(parent) || t.isExportDefaultDeclaration(parent))) {
    comments = parent.leadingComments;
  }
  const description = parser.comment(comments);
  const controller: IController = {
    name,
    description,
    paths: [],
    apis: [],
  };

  decorators.forEach((decorator) => {
    const expression = decorator.node.expression;
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
          controller.paths.push({ type: calleeName, path: apiPath });
        }
      }
    }
  });

  path.traverse({
    ClassMethod: {
      enter(path) {
        controller.apis.push(t_api(path));
      },
    },
  });

  return controller;
}

export function t_api(path: NodePath<t.ClassMethod>) {
  const identifier = path.get('key').node;
  const name = _.get(identifier, 'name') || '/';

  const api: Api = {
    routes: [],
    description: '',
    bodys: [],
    parameters: [],
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
          api.routes.push({ method: calleeName, path: apiPath });
        }
      }
    }
  });
  api.description = parser.comment(path.node.leadingComments);
  return api;
}

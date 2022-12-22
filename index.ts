import traverse, { NodePathResult } from '@babel/traverse';
import { Decorator, StringLiteral } from '@babel/types';
import path from 'path';
import _ from 'lodash';
import * as t from '@babel/types';
import { methods } from './types/routing';
import * as parser from './lib/parser';
import { Api } from './types/openapi';

process.on('uncaughtException', (err) => {
  console.log('unhandledRejection', err);
});

process.on('unhandledRejection', (err) => {
  console.log('unhandledRejection', err);
});

async function r() {
  const filePath = path.resolve('./test.ts');

  const ast = await parser.parse(filePath);

  traverse(ast, {
    ClassDeclaration: {
      enter(path, state) {
        const decorators = path.get('decorators') as NodePathResult<Decorator[]>;

        const routingController = decorators.find((decorator) => {
          const calleeName = _.get(decorator, 'node.expression.callee.name');
          return calleeName === 'Controller' || calleeName === 'JsonController';
        });

        if (!routingController) return;

        // controller 类名
        const controllerName = path.get('id').node.name;

        // 接口路径解析
        const args = _.get(routingController, 'node.expression.arguments') ?? [];
        let apiPath = '/';
        if (args) {
          const pathArg = args[0];
          if (t.isStringLiteral(pathArg)) {
            apiPath = _.get(pathArg as StringLiteral, 'value') || '';
          }
        }

        path.traverse({
          ClassMethod(path, state) {
            const identifier = path.get('key').node;
            const name = _.get(identifier, 'name') || '/';

            const api: Api = {
              routes: [],
              description: '',
              bodys: [],
              parameters: [],
            };

            const decorators = path.get('decorators') as NodePathResult<Decorator[]>;

            decorators.forEach((decorator) => {
              const calleeName = _.get(decorator, 'node.expression.callee.name');
              if (!calleeName) return;
              // 接口路径解析
              const args = _.get(decorator, 'node.expression.arguments') ?? [];
              let apiPath = '/';
              if (args) {
                const pathArg = args[0];
                if (t.isStringLiteral(pathArg)) {
                  apiPath = _.get(pathArg as StringLiteral, 'value') || '';
                }
              }

              if (methods.includes(calleeName)) {
                api.routes.push({ method: calleeName, path: apiPath });
              }
            });
            api.description = parser.comment(path);
            console.log(api);
          },
        });
      },
    },
    Decorator: {
      enter(path, state) {},
    },
  });
}
r();

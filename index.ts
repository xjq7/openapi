import traverse from '@babel/traverse';
import path from 'path';
import _ from 'lodash';
import * as parser from './lib/parser';
import * as _traverse from './lib/traverse';
import { IController } from './types/routing';

process.on('uncaughtException', (err) => {
  console.log('unhandledRejection', err);
});

process.on('unhandledRejection', (err) => {
  console.log('unhandledRejection', err);
});

async function main() {
  const filePath = path.resolve('./test.ts');
  const ast = await parser.parse(filePath);
  const controllers: IController[] = [];
  traverse(ast, {
    ClassDeclaration: {
      enter(path) {
        const controller = _traverse.t_controller(path);
        controllers.push(controller);
      },
    },
  });
  console.log(JSON.stringify(controllers));
}
main();

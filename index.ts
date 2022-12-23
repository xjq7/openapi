import path from 'path';
import _ from 'lodash';
import * as commonParser from './lib/parser/common';
import RctTraverse from './lib/traverse/rct';

process.on('uncaughtException', (err) => {
  console.log('unhandledRejection', err);
});

process.on('unhandledRejection', (err) => {
  console.log('unhandledRejection', err);
});

async function main() {
  const filePath = path.resolve('./test.ts');

  const ast = await commonParser.ASTparse(filePath);

  const traverseInstance = new RctTraverse();
  const controllers = traverseInstance.traverse([ast]);
}
main();

import path from 'path';
import _ from 'lodash';
import RctTraverse from './lib/traverse/rct';

process.on('uncaughtException', (err) => {
  console.log('unhandledRejection', err.message);
});

process.on('unhandledRejection', (err) => {
  console.log('unhandledRejection', err);
});

async function main() {
  const files = [];

  const filePath = path.resolve('./test.ts');
  files.push({ filePath });
  const traverseInstance = new RctTraverse();
  const controllers = traverseInstance.traverse(files);
}
main();

import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import fs from 'fs';

function r() {
  const content = fs.readFileSync('./test.ts', 'utf8');
  const code = `function square(n) {
    return n * n;
  }`;

  const ast = parser.parse(content, {
    sourceType: 'module',
    plugins: ['transform-decorators-legacy', '@babel/plugin-proposal-decorators'],
  });

  traverse(ast, {
    enter(path) {
      console.log(path);
      if (path.isIdentifier({ name: 'n' })) {
        path.node.name = 'x';
      }
    },
  });
}

r();

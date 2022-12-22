import fs from 'fs/promises';
import * as parser from '@babel/parser';
import { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import _ from 'lodash';
import doctrine from 'doctrine';

export async function parse(path: string) {
  const content = await fs.readFile(path, 'utf8');
  const ast = parser.parse(content, {
    sourceType: 'module',
    plugins: ['typescript', 'decorators-legacy'],
  });
  return ast;
}

export function comment(path: NodePath<t.ClassMethod>) {
  const comments = _.get(path, 'node.leadingComments');

  return (
    comments?.reduce((acc, cur) => {
      const { value } = cur;
      const { description } = doctrine.parse(value, { unwrap: true });
      return acc + description + '\n';
    }, '') || ''
  );
}

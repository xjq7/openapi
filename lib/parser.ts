import fs from 'fs/promises';
import * as parser from '@babel/parser';
import * as t from '@babel/types';
import _ from 'lodash';
import doctrine from 'doctrine';

/**
 * AST 解析
 *
 * @export
 * @param {string} path
 * @return {*}
 */
export async function parse(path: string) {
  const content = await fs.readFile(path, 'utf8');
  const ast = parser.parse(content, {
    sourceType: 'module',
    plugins: ['typescript', 'decorators-legacy'],
  });
  return ast;
}

/**
 * 解析注释, 返回文本
 *
 * @export
 * @param {(t.Comment[] | null)} [comments]
 * @return {string}
 */
export function comment(comments?: t.Comment[] | null): string {
  if (!comments) return '';
  return comments?.reduce((acc, cur) => {
    const { value } = cur;
    const { description } = doctrine.parse(value, { unwrap: true });
    return acc + description + '\n';
  }, '');
}

import * as t from '@babel/types';
import doctrine from 'doctrine';
import fs from 'fs';
import * as parser from '@babel/parser';
import _ from 'lodash';

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

/**
 * AST 解析
 *
 * @export
 * @param {string} path
 * @return {*}
 */
export function ASTparse(path: string) {
  if (!fs.existsSync(path)) return null;
  const content = fs.readFileSync(path, 'utf8');
  const ast = parser.parse(content, {
    sourceType: 'module',
    plugins: ['typescript', 'decorators-legacy'],
  });
  return ast;
}

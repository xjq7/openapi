import fs from 'fs';
/**
 * resolve 带文件后缀的路径
 *
 * @export
 * @param {string} filePath
 * @return {*}
 */
export function resolveFilePath(filePath: string) {
  for (const suffix of ['', '.d.ts', '.ts']) {
    const path = filePath + suffix;
    console.log(path);

    if (fs.existsSync(path)) {
      return path;
    }
  }
  return '';
}

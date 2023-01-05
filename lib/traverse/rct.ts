import _ from 'lodash';
import { IController } from '../../types/rct';
import { Controller } from '../parser/rct';
import { ModuleParser } from '../parser/ts';

export default class Rct {
  private controllers: IController[] = [];
  private moduleParser: ModuleParser;

  constructor() {
    this.moduleParser = new ModuleParser();
  }

  /**
   * 文件级别: ast 树中提取路由信息
   *
   * @param {{
   *       filePath: string;
   *     }[]} files
   * @return {*}
   * @memberof Rct
   */
  public traverse(
    files: {
      filePath: string;
    }[]
  ) {
    const _this = this;

    for (const file of files) {
      const { filePath } = file;

      _this.moduleParser.parse(filePath);

      const controllerParser = new Controller({
        filePath,
        moduleParser: _this.moduleParser,
      });
      const controllers = controllerParser.traverse();
    }

    return _this.controllers;
  }
}

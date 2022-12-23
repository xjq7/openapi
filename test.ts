import { Controller, Param, Body, Get, Post, Put, Delete } from 'routing-controllers';

interface B {
  a: string;
  b: number;
}

/**
 * adsadasd
 *
 * @class UserController
 */
@Controller('/')
export default class UserController {
  // 修改访客保护期设置
  // 修改访客保护期设置
  /**
   * 通过 project_id 批量获取项目
   * 通过 project_id 批量获取项目
   */
  @Get('/users/:id')
  @Post('/users')
  getOne(
    @Param('id') id: number,
    @Body()
    b: {
      a: string;
      b: number;
    }
  ): string {
    return 'This action returns user #' + id;
  }
}

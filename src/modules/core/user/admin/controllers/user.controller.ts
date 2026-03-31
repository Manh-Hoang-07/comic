import { Body, Controller, Delete, Get, Param, Patch, Put, Post, Query } from '@nestjs/common';
import { UserService } from '../services/user.service';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { ChangePasswordDto } from '../dtos/change-password.dto';
import { UserQueryDto } from '../dtos/user-query.dto';
import { LogRequest } from '@/common/shared/decorators';
import { Permission } from '@/common/auth/decorators';

@Controller('admin/users')
export class UserController {
  constructor(private readonly service: UserService) { }

  @Permission('user.manage')
  @Get()
  getList(@Query() query: UserQueryDto) {
    return this.service.getList(query);
  }

  @Permission('user.manage')
  @Get('simple')
  getSimpleList(@Query() query: UserQueryDto) {
    return this.service.getSimpleList(query);
  }

  @Permission('user.manage')
  @Get(':id')
  getOne(@Param('id') id: any) {
    return this.service.getOne(id);
  }

  @Permission('user.manage')
  @LogRequest({ fileBaseName: 'user_create' })
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.service.create(dto);
  }

  @Permission('user.manage')
  @LogRequest({ fileBaseName: 'user_update' })
  @Put(':id')
  update(@Param('id') id: any, @Body() dto: UpdateUserDto) {
    return this.service.update(id, dto);
  }

  @Permission('user.manage')
  @LogRequest({ fileBaseName: 'user_change_password' })
  @Patch(':id/password')
  changePassword(@Param('id') id: any, @Body() dto: ChangePasswordDto) {
    return this.service.changePassword(id, dto);
  }

  @Permission('user.manage')
  @LogRequest({ fileBaseName: 'user_delete' })
  @Delete(':id')
  delete(@Param('id') id: any) {
    return this.service.delete(id);
  }
}


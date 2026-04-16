import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { LogRequest } from '@/common/shared/decorators';
import { Permission } from '@/common/auth/decorators';
import { PermissionService } from '@/modules/system/permission/admin/services/permission.service';

@Controller('admin/permissions')
export class PermissionController {
  constructor(private readonly service: PermissionService) {}

  @Permission('permission.manage')
  @Get()
  async getList(@Query() query: any) {
    return this.service.getList(query);
  }

  @Permission('permission.manage')
  @Get('simple')
  async getSimpleList(@Query() query: any) {
    return this.service.getSimpleList(query);
  }

  @Permission('permission.manage')
  @Get(':id')
  async getOne(@Param('id') id: any) {
    return this.service.getOne(id);
  }

  @Permission('permission.manage')
  @LogRequest()
  @Post()
  async create(@Body() dto: any) {
    return this.service.create(dto);
  }

  @Permission('permission.manage')
  @LogRequest()
  @Put(':id')
  async update(@Param('id') id: any, @Body() dto: any) {
    return this.service.update(id, dto);
  }

  @Permission('permission.manage')
  @LogRequest()
  @Delete(':id')
  async delete(@Param('id') id: any) {
    return this.service.delete(id);
  }
}

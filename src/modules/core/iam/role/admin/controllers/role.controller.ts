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
import { Permission } from '@/common/auth/decorators';
import { LogRequest } from '@/common/shared/decorators';
import { Auth } from '@/common/auth/utils';
import { RoleService } from '@/modules/core/iam/role/admin/services/role.service';

@Controller('admin/roles')
export class RoleController {
  constructor(private readonly service: RoleService) {}

  @Permission('role.manage')
  @Get()
  async getList(@Query() query: any) {
    return this.service.getList(query);
  }

  @Permission('role.manage')
  @Get('simple')
  async getSimpleList(@Query() query: any) {
    return this.service.getSimpleList(query);
  }

  @Permission('role.manage')
  @Get(':id')
  async getOne(@Param('id') id: any) {
    return this.service.getOne(id);
  }

  @LogRequest()
  @Permission('role.manage')
  @Post()
  async create(@Body() dto: any) {
    // Auth.id() lấy user ID từ RequestContext
    const userId = Auth.id();
    if (!userId) {
      throw new Error('User not logged in');
    }
    return this.service.create(dto);
  }

  @LogRequest()
  @Permission('role.manage')
  @Put(':id')
  async update(@Param('id') id: any, @Body() dto: any) {
    // Auth.isLogin() kiểm tra từ RequestContext
    if (!Auth.isLogin()) {
      throw new Error('User not logged in');
    }
    return this.service.update(id, dto);
  }

  @LogRequest()
  @Permission('role.manage')
  @Delete(':id')
  async delete(@Param('id') id: any) {
    return this.service.delete(id);
  }

  @LogRequest()
  @Permission('role.manage')
  @Post(':id/permissions')
  async assignPermissions(
    @Param('id') roleId: any,
    @Body() body: { permission_ids: any[] },
  ) {
    return this.service.assignPermissions(roleId, body.permission_ids || []);
  }
}

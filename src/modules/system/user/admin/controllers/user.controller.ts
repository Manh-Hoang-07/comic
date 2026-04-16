import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Put,
  Post,
  Query,
} from '@nestjs/common';
import type { PrimaryKey } from '@/common/core/utils/primary-key.util';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserService } from '../services/user.service';
import { UserRolesService } from '../services/user-roles.service';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { ChangePasswordDto } from '../dtos/change-password.dto';
import { UserRolesBatchItemDto } from '../dtos/user-roles-batch.dto';
import { UserQueryDto } from '../dtos/user-query.dto';
import { LogRequest } from '@/common/shared/decorators';
import { Permission } from '@/common/auth/decorators';
import { PERM } from '@/modules/system/rbac/rbac.constants';

@ApiTags('Admin / User Management')
@ApiBearerAuth('access-token')
@Controller('admin/users')
export class UserController {
  constructor(
    private readonly service: UserService,
    private readonly userRoles: UserRolesService,
  ) {}

  // ── User Management ────────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Lấy danh sách người dùng' })
  @Permission(PERM.USER.VIEW)
  @Get()
  getList(@Query() query: UserQueryDto) {
    return this.service.getList(query);
  }

  @ApiOperation({ summary: 'Lấy danh sách rút gọn' })
  @Permission(PERM.USER.VIEW)
  @Get('simple')
  getSimpleList(@Query() query: UserQueryDto) {
    return this.service.getSimpleList(query);
  }

  @ApiOperation({ summary: 'Lấy chi tiết người dùng' })
  @Permission(PERM.USER.VIEW)
  @Get(':id')
  getOne(@Param('id') id: PrimaryKey) {
    return this.service.getOne(id);
  }

  @ApiOperation({ summary: 'Cây group → role (catalog + trạng thái đã gán)' })
  @Permission(PERM.USER.VIEW)
  @Get(':id/roles/tree')
  getRolesTree(
    @Param('id') id: PrimaryKey,
    @Query('groupIds') groupIds?: string,
  ) {
    return this.userRoles.getUserRolesTree(id, groupIds);
  }

  @ApiOperation({
    summary:
      'Đồng bộ vai trò theo nhiều group (body: mảng { group_id, role_ids })',
  })
  @ApiBody({ type: [UserRolesBatchItemDto] })
  @Permission(PERM.ASSIGNMENT.MANAGE)
  @LogRequest({ fileBaseName: 'user_roles_batch' })
  @Put(':id/roles/batch')
  putRolesBatch(
    @Param('id') id: PrimaryKey,
    @Body() body: UserRolesBatchItemDto[],
  ) {
    return this.userRoles.batchSyncUserRoles(id, body);
  }

  @ApiOperation({ summary: 'Lấy danh sách vai trò của người dùng' })
  @Permission(PERM.USER.VIEW)
  @Get(':id/roles')
  getRoles(@Param('id') id: PrimaryKey, @Query('groupIds') groupIds?: string) {
    return this.userRoles.getUserRoles(id, groupIds);
  }

  @ApiOperation({ summary: 'Tạo người dùng mới' })
  @Permission(PERM.USER.CREATE)
  @LogRequest({ fileBaseName: 'user_create' })
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.service.create(dto);
  }

  @ApiOperation({ summary: 'Cập nhật người dùng' })
  @Permission(PERM.USER.UPDATE)
  @LogRequest({ fileBaseName: 'user_update' })
  @Put(':id')
  update(@Param('id') id: PrimaryKey, @Body() dto: UpdateUserDto) {
    return this.service.update(id, dto);
  }

  @ApiOperation({ summary: 'Đổi mật khẩu người dùng' })
  @Permission(PERM.USER.UPDATE)
  @LogRequest({ fileBaseName: 'user_change_password' })
  @Patch(':id/password')
  changePassword(@Param('id') id: PrimaryKey, @Body() dto: ChangePasswordDto) {
    return this.service.changePassword(id, dto);
  }

  @ApiOperation({ summary: 'Xóa người dùng' })
  @Permission(PERM.USER.DELETE)
  @LogRequest({ fileBaseName: 'user_delete' })
  @Delete(':id')
  delete(@Param('id') id: PrimaryKey) {
    return this.service.delete(id);
  }

  @ApiOperation({ summary: 'Cập nhật trạng thái người dùng (Khóa/Mở khóa)' })
  @Permission(PERM.USER.STATUS)
  @LogRequest({ fileBaseName: 'user_status' })
  @Patch(':id/status')
  updateStatus(@Param('id') id: PrimaryKey, @Body() body: { status: string }) {
    return this.service.update(id, { status: body.status });
  }
}

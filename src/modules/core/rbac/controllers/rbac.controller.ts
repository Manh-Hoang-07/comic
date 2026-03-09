import { Controller, Put, Body, Param, ParseIntPipe, BadRequestException } from '@nestjs/common';
import { LogRequest } from '@/common/shared/decorators';
import { Permission } from '@/common/auth/decorators';
import { RbacService } from '@/modules/core/rbac/services/rbac.service';
import { RequestContext } from '@/common/shared/utils';
import { Auth } from '@/common/auth/utils';
import { ExecutionContext } from '@nestjs/common';
import { PERM } from '@/modules/core/rbac/rbac.constants';

@Controller('admin/users')
export class RbacController {
  constructor(private readonly service: RbacService) { }

  /**
   * Sync roles cho user trong group (thay thế toàn bộ roles hiện tại trong group)
   * System admin có thể bỏ qua validation
   * Group_id tự động lấy từ RequestContext (không cần truyền trong body)
   */
  @Permission(PERM.ROLE.MANAGE)
  @LogRequest()
  @Put(':id/roles')
  async syncRoles(
    @Param('id', ParseIntPipe) targetUserId: number,
    @Body() body: { role_ids: number[] },
    context?: ExecutionContext,
  ) {
    // Lấy groupId từ RequestContext (đã được set bởi GroupInterceptor)
    const groupId = RequestContext.get<number | null>('groupId');

    if (!groupId) {
      throw new BadRequestException('Group ID is required. Please specify X-Group-Id header or group_id query parameter');
    }

    // Check nếu user hiện tại là System Admin
    const currentUserId = Auth.id(context);
    const isSystemAdmin = currentUserId
      ? await this.service.isSystemAdmin(currentUserId)
      : false;

    // System admin có thể bỏ qua validation (có thể gán bất kỳ role nào)
    const skipValidation = isSystemAdmin;

    return this.service.syncRolesInGroup(targetUserId, groupId, body.role_ids || [], skipValidation);
  }
}




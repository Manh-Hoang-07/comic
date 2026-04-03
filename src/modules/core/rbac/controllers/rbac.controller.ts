import { Controller, Put, Body, Param, BadRequestException } from '@nestjs/common';
import { LogRequest } from '@/common/shared/decorators';
import { Permission } from '@/common/auth/decorators';
import { RbacService } from '@/modules/core/rbac/services/rbac.service';
import { RequestContext } from '@/common/shared/utils';
import { getCurrentUserId } from '@/common/auth/utils/auth-context.helper';
import { PERM } from '@/modules/core/rbac/rbac.constants';

@Controller('admin/users')
export class RbacController {
  constructor(private readonly service: RbacService) { }

  /**
   * Sync roles cho user trong group (thay thế toàn bộ roles hiện tại trong group)
   * Super Admin: truyền group_id trong body để chuyển group tùy ý.
   * Group Admin: không cần group_id, tự lấy từ RequestContext (x-group-id header).
   */
  @Permission(PERM.ASSIGNMENT.MANAGE)
  @LogRequest()
  @Put(':id/roles')
  async syncRoles(
    @Param('id') targetUserId: any,
    @Body() body: { role_ids: any[]; group_id?: any },
  ) {
    // 1. Group ID: ưu tiên body (Super Admin), fallback RequestContext (Group Admin)
    const groupId = body.group_id || RequestContext.get<any>('groupId');

    if (!groupId) {
      throw new BadRequestException(
        'Group ID is required. Please specify group_id in body or X-Group-Id header.',
      );
    }

    // 2. Check System Context
    const isSystemContext = RequestContext.get<any>('context')?.type === 'system';

    return this.service.syncRolesInGroup(targetUserId, groupId, body.role_ids || [], isSystemContext);
  }
}





import {
  Controller,
  Put,
  Body,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { LogRequest } from '@/common/shared/decorators';
import { Permission } from '@/common/auth/decorators';
import { RbacService } from '@/modules/system/rbac/services/rbac.service';
import { RequestContext } from '@/common/shared/utils';
import { isSysCtx } from '@/common/shared/utils/request-group-context.util';
import { PERM } from '@/modules/system/rbac/rbac.constants';
import { RbacId } from '@/modules/system/rbac/rbac.types';

type SyncRolesBody = {
  role_ids?: RbacId[];
  group_id?: RbacId;
};

@Controller('admin/users')
export class RbacController {
  constructor(private readonly service: RbacService) {}

  /**
   * Sync roles cho user trong group (thay thế toàn bộ roles hiện tại trong group)
   * Super Admin: truyền group_id trong body để chuyển group tùy ý.
   * Group Admin: không cần group_id, tự lấy từ RequestContext (x-group-id header).
   */
  @Permission(PERM.ASSIGNMENT.MANAGE)
  @LogRequest()
  @Put(':id/roles')
  async syncRoles(
    @Param('id') targetUserId: RbacId,
    @Body() body: SyncRolesBody,
  ) {
    const groupId =
      body.group_id ?? RequestContext.get<RbacId | null>('groupId');
    if (!groupId) {
      throw new BadRequestException(
        'Group ID is required. Please specify group_id in body or X-Group-Id header.',
      );
    }
    return this.service.syncRolesInGroup(
      targetUserId,
      groupId,
      body.role_ids ?? [],
      isSysCtx(),
    );
  }
}

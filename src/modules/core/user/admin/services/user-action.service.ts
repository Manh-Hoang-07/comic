import { Injectable } from '@nestjs/common';
import { RequestContext } from '@/common/shared/utils';
import { RbacService } from '@/modules/core/rbac/services/rbac.service';
import { normalizeIdArray } from '@/modules/core/iam/utils/iam-transform.helper';
import { UserRepository } from '@/modules/core/user/repositories/user.repository';

@Injectable()
export class UserActionService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly rbacService: RbacService,
  ) {}

  /**
   * Synchronizes user profile and role assignments.
   */
  async syncRelations(userId: any, data: { profile?: any; role_ids?: any }): Promise<void> {
    if (data.profile) {
      await this.userRepo.upsertProfile(userId, data.profile);
    }

    const roleIds = normalizeIdArray(data.role_ids);
    if (roleIds !== null) {
      const groupId = RequestContext.get<number | null>('groupId');
      if (groupId) {
        await this.rbacService.syncRolesInGroup(userId, groupId, roleIds, true);
      }
    }
  }
}



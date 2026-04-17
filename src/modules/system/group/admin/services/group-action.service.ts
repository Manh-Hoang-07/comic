import { Injectable, Inject } from '@nestjs/common';
import {
  IUserGroupRepository,
  USER_GROUP_REPOSITORY,
} from '@/modules/system/rbac/user-group/domain/user-group.repository';
import {
  IRoleRepository,
  ROLE_REPOSITORY,
} from '@/modules/system/role/domain/role.repository';
import { RbacService } from '@/modules/system/rbac/services/rbac.service';
import { toPrimaryKey } from '@/common/core/repositories/prisma-query.helper';
import { RedisUtil } from '@/core/utils/redis.util';
import { invalidateUserGroupsListCache } from '@/modules/system/group/user/user-groups-list.cache';

@Injectable()
export class GroupActionService {
  constructor(
    @Inject(USER_GROUP_REPOSITORY)
    private readonly userGroupRepo: IUserGroupRepository,
    @Inject(ROLE_REPOSITORY)
    private readonly roleRepo: IRoleRepository,
    private readonly rbacService: RbacService,
    private readonly redis: RedisUtil,
  ) {}

  /**
   * Syncs the owner of a newly created group by adding them to the group
   * and assigning the default 'admin' role within that group.
   */
  async syncGroupOwner(groupId: any, ownerId: any): Promise<void> {
    // 1. Ensure user is in user_groups mapping
    const existing = await this.userGroupRepo.findUnique(ownerId, groupId);
    if (!existing) {
      await this.userGroupRepo.create({
        user_id: toPrimaryKey(ownerId),
        group_id: toPrimaryKey(groupId),
      });
    }

    // 2. Assign default 'admin' role in this group context
    const ownerRole = await this.roleRepo.findOne({ code: 'admin' });
    if (ownerRole) {
      await this.rbacService.assignRoleToUser(ownerId, ownerRole.id, groupId);
    }
    await invalidateUserGroupsListCache(this.redis, ownerId);
  }
}

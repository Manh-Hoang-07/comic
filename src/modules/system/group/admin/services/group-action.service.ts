import { Injectable, Inject } from '@nestjs/common';
import {
  IUserGroupRepository,
  USER_GROUP_REPOSITORY,
} from '@/modules/system/rbac/user-group/domain/user-group.repository';
import { toPrimaryKey } from '@/common/core/repositories/prisma-query.helper';
import { RedisUtil } from '@/core/utils/redis.util';
import { invalidateUserGroupsListCache } from '@/modules/system/group/user/user-groups-list.cache';

@Injectable()
export class GroupActionService {
  constructor(
    @Inject(USER_GROUP_REPOSITORY)
    private readonly userGroupRepo: IUserGroupRepository,
    private readonly redis: RedisUtil,
  ) {}

  /**
   * Thêm owner vào group (user_groups mapping).
   * Việc gán role do admin thực hiện riêng.
   */
  async syncGroupOwner(groupId: any, ownerId: any): Promise<void> {
    const existing = await this.userGroupRepo.findUnique(ownerId, groupId);
    if (!existing) {
      await this.userGroupRepo.create({
        user_id: toPrimaryKey(ownerId),
        group_id: toPrimaryKey(groupId),
      });
    }
    await invalidateUserGroupsListCache(this.redis, ownerId);
  }
}

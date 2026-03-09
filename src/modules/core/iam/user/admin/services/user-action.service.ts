import { Injectable, Inject } from '@nestjs/common';
import { IUserRepository, USER_REPOSITORY } from '@/modules/core/iam/user/domain/user.repository';
import { RbacService } from '@/modules/core/rbac/services/rbac.service';
import { RequestContext } from '@/common/shared/utils';
import { normalizeIdArray } from '../../../utils/iam-transform.helper';

@Injectable()
export class UserActionService {
    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepo: IUserRepository,
        private readonly rbacService: RbacService,
    ) { }

    /**
     * Sync profile and roles for a specific user within a group.
     */
    async syncRelations(userId: number, data: { profile?: any; role_ids?: any }): Promise<void> {
        // 1. Handle Profile
        if (data.profile) {
            await this.userRepo.upsertProfile(userId, data.profile);
        }

        // 2. Handle Roles syncing in current group context
        const roleIds = normalizeIdArray(data.role_ids);
        if (roleIds !== null) {
            const groupId = RequestContext.get<number | null>('groupId');
            if (groupId) {
                // We sync roles specifically for the current group context
                await this.rbacService.syncRolesInGroup(userId, groupId, roleIds, true);
            }
        }
    }
}

import { Injectable, Inject } from '@nestjs/common';
import { IUserGroupRepository, USER_GROUP_REPOSITORY } from '@/modules/core/rbac/user-group/domain/user-group.repository';
import { IRoleRepository, ROLE_REPOSITORY } from '@/modules/core/iam/role/domain/role.repository';
import { RbacService } from '@/modules/core/rbac/services/rbac.service';

@Injectable()
export class GroupActionService {
    constructor(
        @Inject(USER_GROUP_REPOSITORY)
        private readonly userGroupRepo: IUserGroupRepository,
        @Inject(ROLE_REPOSITORY)
        private readonly roleRepo: IRoleRepository,
        private readonly rbacService: RbacService,
    ) { }

    /**
     * Syncs the owner of a newly created group by adding them to the group 
     * and assigning the default 'admin' role within that group.
     */
    async syncGroupOwner(groupId: bigint, ownerId: bigint): Promise<void> {
        const numericOwnerId = Number(ownerId);
        const numericGroupId = Number(groupId);

        // 1. Ensure user is in user_groups mapping
        const existing = await this.userGroupRepo.findUnique(numericOwnerId, numericGroupId);
        if (!existing) {
            await this.userGroupRepo.create({
                user_id: ownerId,
                group_id: groupId,
            });
        }

        // 2. Assign default 'admin' role in this group context
        const ownerRole = await this.roleRepo.findOne({ code: 'admin' });
        if (ownerRole) {
            await this.rbacService.assignRoleToUser(
                numericOwnerId,
                Number(ownerRole.id),
                numericGroupId
            );
        }
    }
}

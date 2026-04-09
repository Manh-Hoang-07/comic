import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { toPrimaryKey } from '@/common/core/repositories/prisma-query.helper';
import { IGroupRepository, GROUP_REPOSITORY } from '@/modules/core/context/group/domain/group.repository';
import { IRoleContextRepository, ROLE_CONTEXT_REPOSITORY } from '@/modules/core/rbac/role-context/domain/role-context.repository';
import { IUserRoleAssignmentRepository, USER_ROLE_ASSIGNMENT_REPOSITORY } from '@/modules/core/rbac/user-role-assignment/domain/user-role-assignment.repository';
import { RbacId } from '@/modules/core/rbac/rbac.types';

@Injectable()
export class RbacRoleAssignmentService {
  constructor(
    @Inject(USER_ROLE_ASSIGNMENT_REPOSITORY) private readonly assignmentRepo: IUserRoleAssignmentRepository,
    @Inject(ROLE_CONTEXT_REPOSITORY) private readonly roleContextRepo: IRoleContextRepository,
    @Inject(GROUP_REPOSITORY) private readonly groupRepo: IGroupRepository,
  ) { }

  async assignRoleToUser(userId: RbacId, roleId: RbacId, groupId: RbacId): Promise<void> {
    const existing = await this.assignmentRepo.findUnique(userId, roleId, groupId);
    if (!existing) {
      await this.assignmentRepo.create({
        user_id: toPrimaryKey(userId),
        role_id: toPrimaryKey(roleId),
        group_id: toPrimaryKey(groupId),
      });
    }
  }

  async syncRolesInGroup(
    userId: RbacId,
    groupId: RbacId,
    roleIds: RbacId[] | null | undefined,
    skipValidation = false,
  ): Promise<void> {
    const group = await this.groupRepo.findById(groupId);
    if (!group) throw new NotFoundException('Group not found');
    const normalizedRoleIds = this.normalizeRoleIds(roleIds);

    if (normalizedRoleIds.length && !skipValidation) {
      await this.validateRolesForContext(normalizedRoleIds, (group as any).context_id);
    }

    await this.assignmentRepo.syncRolesInGroup(userId, groupId, normalizedRoleIds);
  }

  async getActivePermissionCodes(userId: RbacId, groupId: RbacId | null): Promise<string[]> {
    return await this.assignmentRepo.findActivePermissionCodes(userId, groupId);
  }

  private async validateRolesForContext(roleIds: RbacId[], contextId: RbacId): Promise<void> {
    const rolePrimaryIds = roleIds.map((id) => toPrimaryKey(id));
    const validLinks = await this.roleContextRepo.findMany({
      where: { role_id: { in: rolePrimaryIds }, context_id: toPrimaryKey(contextId) },
    });

    const validIds = new Set(validLinks.map((rc) => rc.role_id.toString()));
    for (const id of roleIds) {
      if (!validIds.has(toPrimaryKey(id).toString())) {
        throw new BadRequestException(`Role ID ${id} is not allowed in this context`);
      }
    }
  }

  private normalizeRoleIds(roleIds: RbacId[] | null | undefined): RbacId[] {
    if (!Array.isArray(roleIds)) return [];
    return roleIds.filter((id) => id !== null && id !== undefined && `${id}`.trim().length > 0);
  }
}

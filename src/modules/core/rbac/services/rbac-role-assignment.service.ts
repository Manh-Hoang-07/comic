import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { toPrimaryKey } from '@/common/core/repositories/prisma-query.helper';
import { IUserRoleAssignmentRepository, USER_ROLE_ASSIGNMENT_REPOSITORY } from '@/modules/core/rbac/user-role-assignment/domain/user-role-assignment.repository';
import { RbacId } from '@/modules/core/rbac/rbac.types';
import { RoleContextCatalogService } from '@/modules/core/rbac/catalog/role-context-catalog.service';
import { GroupCatalogService } from '@/modules/core/rbac/catalog/group-catalog.service';

@Injectable()
export class RbacRoleAssignmentService {
  constructor(
    @Inject(USER_ROLE_ASSIGNMENT_REPOSITORY) private readonly assignmentRepo: IUserRoleAssignmentRepository,
    private readonly roleContextCatalog: RoleContextCatalogService,
    private readonly groupCatalog: GroupCatalogService,
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
    const group = await this.groupCatalog.getGroupById(groupId);
    if (!group) throw new NotFoundException('Group not found');
    const normalizedRoleIds = this.normalizeRoleIds(roleIds);

    if (normalizedRoleIds.length && !skipValidation) {
      await this.validateRolesForContext(normalizedRoleIds, group.contextId);
    }

    await this.assignmentRepo.syncRolesInGroup(userId, groupId, normalizedRoleIds);
  }

  async getActivePermissionCodes(userId: RbacId, groupId: RbacId | null): Promise<string[]> {
    return await this.assignmentRepo.findActivePermissionCodes(userId, groupId);
  }

  async getActiveRoleIds(userId: RbacId, groupId: RbacId | null): Promise<any[]> {
    return await this.assignmentRepo.findActiveRoleIds(userId, groupId);
  }

  private async validateRolesForContext(roleIds: RbacId[], contextId: any): Promise<void> {
    const allowed = await this.roleContextCatalog.getRoleIdsAllowedInContext(contextId);
    const validIds = new Set(allowed.map(String));
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

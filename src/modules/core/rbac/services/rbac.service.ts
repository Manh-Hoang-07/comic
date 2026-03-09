import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { RbacCacheService } from '@/modules/core/rbac/services/rbac-cache.service';
import { IUserRoleAssignmentRepository, USER_ROLE_ASSIGNMENT_REPOSITORY } from '@/modules/core/rbac/user-role-assignment/domain/user-role-assignment.repository';
import { IRoleHasPermissionRepository, ROLE_HAS_PERMISSION_REPOSITORY } from '@/modules/core/rbac/role-has-permission/domain/role-has-permission.repository';
import { IRoleContextRepository, ROLE_CONTEXT_REPOSITORY } from '@/modules/core/rbac/role-context/domain/role-context.repository';
import { IGroupRepository, GROUP_REPOSITORY } from '@/modules/core/context/group/domain/group.repository';
import { ContextType, PERM } from '@/modules/core/rbac/rbac.constants';
import { PrismaService } from '@/core/database/prisma/prisma.service';

/**
 * Service quản lý RBAC (Role-Based Access Control)
 */
@Injectable()
export class RbacService {
  constructor(
    @Inject(USER_ROLE_ASSIGNMENT_REPOSITORY) private readonly assignmentRepo: IUserRoleAssignmentRepository,
    @Inject(ROLE_HAS_PERMISSION_REPOSITORY) private readonly roleHasPermRepo: IRoleHasPermissionRepository,
    @Inject(ROLE_CONTEXT_REPOSITORY) private readonly roleContextRepo: IRoleContextRepository,
    @Inject(GROUP_REPOSITORY) private readonly groupRepo: IGroupRepository,
    private readonly rbacCache: RbacCacheService,
    private readonly prisma: PrismaService,
  ) { }

  async userHasPermissionsInGroup(userId: number, groupId: number | null, required: string[]): Promise<boolean> {
    if (!(await this.rbacCache.isCached(userId, groupId))) {
      await this.refreshUserPermissions(userId, groupId);
    }

    for (const need of required) {
      if (await this.rbacCache.hasPermission(userId, groupId, need)) return true;
    }
    return false;
  }

  async isSystemAdmin(userId: number): Promise<boolean> {
    return this.userHasPermissionsInGroup(userId, null, [PERM.SYSTEM.MANAGE]);
  }

  async getUserPermissions(userId: number, groupId: number | null): Promise<Set<string>> {
    if (!(await this.rbacCache.isCached(userId, groupId))) {
      await this.refreshUserPermissions(userId, groupId);
    }
    const key = groupId === null ? `rbac:u:${userId}:system` : `rbac:u:${userId}:g:${groupId}`;
    const perms = await (this.rbacCache as any).redis.smembers(key);
    return new Set(perms);
  }

  async refreshUserPermissions(userId: number, groupId: number | null): Promise<void> {
    const where: any = {
      user_id: BigInt(userId),
      status: 'active' as any,
    };

    if (groupId === null) {
      where.group = { context: { type: ContextType.SYSTEM } };
    } else {
      where.group_id = BigInt(groupId);
    }

    const assignments = await this.assignmentRepo.findManyRaw({ where, select: { role_id: true } });
    const roleIds = Array.from(new Set(assignments.map(a => a.role_id)));

    const permissions = roleIds.length ? await this.getFlattenedPermissions(roleIds) : new Set<string>();
    await this.rbacCache.setPermissions(userId, groupId, Array.from(permissions));
  }

  async assignRoleToUser(userId: number, roleId: number, groupId: number): Promise<void> {
    const existing = await this.assignmentRepo.findUnique(userId, roleId, groupId);
    if (!existing) {
      await this.assignmentRepo.create({
        user_id: BigInt(userId),
        role_id: BigInt(roleId),
        group_id: BigInt(groupId)
      });
    }
    await this.refreshUserPermissions(userId, groupId);
  }

  async syncRolesInGroup(userId: number, groupId: number, roleIds: number[], skipValidation = false): Promise<void> {
    const group = await this.groupRepo.findById(groupId);
    if (!group) throw new NotFoundException('Group not found');

    if (roleIds.length && !skipValidation) {
      await this.validateRolesForContext(roleIds, Number((group as any).context_id));
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.userRoleAssignment.deleteMany({
        where: { user_id: BigInt(userId), group_id: BigInt(groupId) }
      });

      if (roleIds.length) {
        await tx.userRoleAssignment.createMany({
          data: roleIds.map(id => ({
            user_id: BigInt(userId),
            role_id: BigInt(id),
            group_id: BigInt(groupId)
          }))
        });
      }
    });

    await this.refreshUserPermissions(userId, groupId);
  }

  // ── Private Helpers ────────────────────────────────────────────────────────

  private async validateRolesForContext(roleIds: number[], contextId: number): Promise<void> {
    const rIdsBi = roleIds.map(BigInt);
    const validLinks = await this.roleContextRepo.findMany({
      where: { role_id: { in: rIdsBi }, context_id: BigInt(contextId) }
    });

    const validIds = new Set(validLinks.map(rc => rc.role_id.toString()));
    for (const id of roleIds) {
      if (!validIds.has(BigInt(id).toString())) {
        throw new BadRequestException(`Role ID ${id} is not allowed in this context`);
      }
    }
  }

  private async getFlattenedPermissions(roleIds: bigint[]): Promise<Set<string>> {
    const result = new Set<string>();
    const links = await this.roleHasPermRepo.findMany({
      where: { role_id: { in: roleIds } },
      include: { permission: true }
    });

    const directPerms = links
      .map(l => (l as any).permission)
      .filter(p => p && p.status === 'active');

    const all = await this.prisma.permission.findMany({ where: { status: 'active' as any } });
    const map = new Map(all.map(p => [p.id, p]));

    for (const p of directPerms) {
      let cur = p;
      if (cur.code) result.add(cur.code);
      while (cur.parent_id && map.has(cur.parent_id)) {
        cur = map.get(cur.parent_id);
        if (cur.code) result.add(cur.code);
      }
    }
    return result;
  }
}

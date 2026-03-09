import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { RbacCacheService } from '@/modules/core/rbac/services/rbac-cache.service';
import { IUserGroupRepository, USER_GROUP_REPOSITORY } from '@/modules/core/rbac/user-group/domain/user-group.repository';
import { IUserRoleAssignmentRepository, USER_ROLE_ASSIGNMENT_REPOSITORY } from '@/modules/core/rbac/user-role-assignment/domain/user-role-assignment.repository';
import { IRoleHasPermissionRepository, ROLE_HAS_PERMISSION_REPOSITORY } from '@/modules/core/rbac/role-has-permission/domain/role-has-permission.repository';
import { IRoleContextRepository, ROLE_CONTEXT_REPOSITORY } from '@/modules/core/rbac/role-context/domain/role-context.repository';
import { IGroupRepository, GROUP_REPOSITORY } from '@/modules/core/context/group/domain/group.repository';
import { IUserRepository, USER_REPOSITORY } from '@/modules/core/iam/user/domain/user.repository';
import { IRoleRepository, ROLE_REPOSITORY } from '@/modules/core/iam/role/domain/role.repository';
import { ContextType, RbacPermission, PERM } from '@/modules/core/rbac/rbac.constants';
import { PrismaService } from '@/core/database/prisma/prisma.service';

/**
 * Service quản lý RBAC (Role-Based Access Control)
 * Bao gồm: kiểm tra quyền/vai trò của user và quản lý roles cho user
 */
@Injectable()
export class RbacService {
  constructor(
    @Inject(USER_GROUP_REPOSITORY) private readonly userGroupRepo: IUserGroupRepository,
    @Inject(USER_ROLE_ASSIGNMENT_REPOSITORY) private readonly assignmentRepo: IUserRoleAssignmentRepository,
    @Inject(ROLE_HAS_PERMISSION_REPOSITORY) private readonly roleHasPermRepo: IRoleHasPermissionRepository,
    @Inject(ROLE_CONTEXT_REPOSITORY) private readonly roleContextRepo: IRoleContextRepository,
    @Inject(GROUP_REPOSITORY) private readonly groupRepo: IGroupRepository,
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
    @Inject(ROLE_REPOSITORY) private readonly roleRepo: IRoleRepository,
    private readonly rbacCache: RbacCacheService,
    private readonly prisma: PrismaService,
  ) { }

  async userHasPermissionsInGroup(userId: number, groupId: number | null, required: string[]): Promise<boolean> {
    if (!(await this.rbacCache.isCached(userId, groupId))) await this.refreshUserPermissions(userId, groupId);
    for (const need of required) {
      if (await this.rbacCache.hasPermission(userId, groupId, need)) return true;
    }
    return false;
  }

  async isSystemAdmin(userId: number): Promise<boolean> {
    return this.userHasPermissionsInGroup(userId, null, [PERM.SYSTEM.MANAGE]);
  }

  async getUserPermissions(userId: number, groupId: number | null): Promise<Set<string>> {
    if (!(await this.rbacCache.isCached(userId, groupId))) await this.refreshUserPermissions(userId, groupId);
    const key = groupId === null ? `rbac:u:${userId}:system` : `rbac:u:${userId}:g:${groupId}`;
    return new Set(await (this.rbacCache as any).redis.smembers(key));
  }

  async refreshUserPermissions(userId: number, groupId: number | null): Promise<void> {
    const where = groupId === null
      ? { user_id: BigInt(userId), group: { context: { type: ContextType.SYSTEM } }, status: 'active' as any }
      : { user_id: BigInt(userId), group_id: BigInt(groupId), status: 'active' as any };

    const assignments = await this.assignmentRepo.findManyRaw({ where, select: { role_id: true } });
    const roleIds = Array.from(new Set(assignments.map(a => a.role_id)));

    const permissions = roleIds.length ? await this.getFlattenedPermissions(roleIds) : new Set<string>();
    await this.rbacCache.setPermissions(userId, groupId, Array.from(permissions));
  }

  private async getFlattenedPermissions(roleIds: bigint[]): Promise<Set<string>> {
    const result = new Set<string>();
    const links = await this.roleHasPermRepo.findMany({ where: { role_id: { in: roleIds } }, include: { permission: true } });
    const directPerms = links.map(l => (l as any).permission).filter(p => p && p.status === 'active');

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

  async assignRoleToUser(userId: number, roleId: number, groupId: number): Promise<void> {
    if (!(await this.assignmentRepo.findUnique(userId, roleId, groupId))) {
      await this.assignmentRepo.create({ user_id: BigInt(userId), role_id: BigInt(roleId), group_id: BigInt(groupId) });
    }
    await this.refreshUserPermissions(userId, groupId);
  }

  async syncRolesInGroup(userId: number, groupId: number, roleIds: number[], skipValidation = false): Promise<void> {
    const group = await this.groupRepo.findById(groupId);
    if (!group) throw new NotFoundException('Group not found');

    if (roleIds.length && !skipValidation) {
      const rIdsBi = roleIds.map(BigInt);
      const valCtx = await this.roleContextRepo.findMany({ where: { role_id: { in: rIdsBi }, context_id: (group as any).context_id } });
      const valIds = new Set(valCtx.map(rc => rc.role_id.toString()));
      for (const id of roleIds) if (!valIds.has(BigInt(id).toString())) throw new BadRequestException(`Role ${id} not allowed`);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.userRoleAssignment.deleteMany({ where: { user_id: BigInt(userId), group_id: BigInt(groupId) } });
      if (roleIds.length) await tx.userRoleAssignment.createMany({ data: roleIds.map(id => ({ user_id: BigInt(userId), role_id: BigInt(id), group_id: BigInt(groupId) })) });
    });
    await this.refreshUserPermissions(userId, groupId);
  }
}

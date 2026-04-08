import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { RbacCacheService } from '@/modules/core/rbac/services/rbac-cache.service';
import { IUserRoleAssignmentRepository, USER_ROLE_ASSIGNMENT_REPOSITORY } from '@/modules/core/rbac/user-role-assignment/domain/user-role-assignment.repository';
import { IRoleHasPermissionRepository, ROLE_HAS_PERMISSION_REPOSITORY } from '@/modules/core/rbac/role-has-permission/domain/role-has-permission.repository';
import { IRoleContextRepository, ROLE_CONTEXT_REPOSITORY } from '@/modules/core/rbac/role-context/domain/role-context.repository';
import { IGroupRepository, GROUP_REPOSITORY } from '@/modules/core/context/group/domain/group.repository';
import { PrismaService } from '@/core/database/prisma/prisma.service';
import { toPrimaryKey } from '@/common/core/repositories/prisma-query.helper';
import { PERM } from '@/modules/core/rbac/rbac.constants';

/**
 * Service quản lý RBAC (Role-Based Access Control)
 *
 * Cache Redis chỉ lưu các mã quyền được gán trực tiếp qua role.
 * Khi check route: đủ nếu user có đúng mã đó hoặc có bất kỳ quyền cha nào trên cây parent_id.
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

  private permissionByIdCache = new Map<string, any>();
  private permissionByCodeCache = new Map<string, any>();
  private lastPermFetch = 0;
  private readonly PERM_CACHE_TTL = 300000; // 5 minutes

  async userHasPermissionsInGroup(userId: any, groupId: any | null, required: string[]): Promise<boolean> {
    await this.ensurePermissionIndexes();

    // Fast path: in group scope, evaluate group permissions first.
    // Only fallback to system scope when group scope does not satisfy required permissions.
    if (groupId !== null) {
      const groupPerms = await this.getUserPermissions(userId, groupId);
      for (const need of required) {
        if (this.grants(groupPerms, need)) return true;
      }
    }

    const systemPerms = await this.getUserPermissions(userId, null);
    for (const need of required) {
      if (this.grants(systemPerms, need)) return true;
    }

    return false;
  }

  async getUserPermissions(userId: any, groupId: any | null): Promise<Set<string>> {
    if (!(await this.rbacCache.isCached(userId, groupId))) {
      await this.refreshUserPermissions(userId, groupId);
    }

    return this.rbacCache.getPermissions(userId, groupId);
  }

  async refreshUserPermissions(userId: any, groupId: any | null): Promise<void> {
    const assignments = await this.prisma.userRoleAssignment.findMany({
      where: {
        user_id: toPrimaryKey(userId),
        role: { status: 'active' },
        ...(groupId === null
          ? { group: { code: 'system' } }
          : { group_id: toPrimaryKey(groupId) }),
      },
      select: { role_id: true }
    });
    const roleIds = Array.from(new Set(assignments.map(a => a.role_id)));

    const permissions = roleIds.length ? await this.getDirectPermissionCodes(roleIds) : new Set<string>();
    await this.rbacCache.setPermissions(userId, groupId, Array.from(permissions));
  }

  async assignRoleToUser(userId: any, roleId: any, groupId: any): Promise<void> {
    const existing = await this.assignmentRepo.findUnique(userId, roleId, groupId);
    if (!existing) {
      await this.assignmentRepo.create({
        user_id: toPrimaryKey(userId),
        role_id: toPrimaryKey(roleId),
        group_id: toPrimaryKey(groupId)
      });
    }
    await this.refreshUserPermissions(userId, groupId);
  }

  async syncRolesInGroup(userId: any, groupId: any, roleIds: any[], skipValidation = false): Promise<void> {
    const group = await this.groupRepo.findById(groupId);
    if (!group) throw new NotFoundException('Group not found');

    if (roleIds.length && !skipValidation) {
      await this.validateRolesForContext(roleIds, (group as any).context_id);
    }

    await this.prisma.$transaction(async (tx) => {
      if (roleIds.length > 0) {
        const userIdPk = toPrimaryKey(userId);
        const groupIdPk = toPrimaryKey(groupId);
        await tx.userGroup.upsert({
          where: {
            user_id_group_id: {
              user_id: userIdPk,
              group_id: groupIdPk,
            },
          },
          create: {
            user_id: userIdPk,
            group_id: groupIdPk,
            joined_at: new Date(),
          },
          update: {},
        });
      }

      await tx.userRoleAssignment.deleteMany({
        where: { user_id: toPrimaryKey(userId), group_id: toPrimaryKey(groupId) }
      });

      if (roleIds.length) {
        await tx.userRoleAssignment.createMany({
          data: roleIds.map(id => ({
            user_id: toPrimaryKey(userId),
            role_id: toPrimaryKey(id),
            group_id: toPrimaryKey(groupId)
          }))
        });
      }
    });

    await this.refreshUserPermissions(userId, groupId);
  }

  // ── Private Helpers ────────────────────────────────────────────────────────

  private async validateRolesForContext(roleIds: any[], contextId: any): Promise<void> {
    const rIdsBi = roleIds.map(id => toPrimaryKey(id));
    const validLinks = await this.roleContextRepo.findMany({
      where: { role_id: { in: rIdsBi }, context_id: toPrimaryKey(contextId) }
    });

    const validIds = new Set(validLinks.map(rc => rc.role_id.toString()));
    for (const id of roleIds) {
      if (!validIds.has(toPrimaryKey(id).toString())) {
        throw new BadRequestException(`Role ID ${id} is not allowed in this context`);
      }
    }
  }

  private async ensurePermissionIndexes(): Promise<void> {
    if (Date.now() - this.lastPermFetch > this.PERM_CACHE_TTL || this.permissionByIdCache.size === 0) {
      const all = await this.prisma.permission.findMany({ where: { status: 'active' as any } });
      this.permissionByIdCache = new Map(all.map((p) => [String(p.id), p]));
      this.permissionByCodeCache = new Map(all.map((p) => [p.code, p]));
      this.lastPermFetch = Date.now();
    }
  }

  /** Load cây quyền vào bộ nhớ (gọi trước `matchesAssigned` từ menu/UI nếu chỉ có Set mã đã gán). */
  async preparePermissionCheck(): Promise<void> {
    await this.ensurePermissionIndexes();
  }

  /**
   * User có mã `need` hoặc có quyền cha của `need` trên cây parent_id.
   * Phải gọi `preparePermissionCheck()` trước (hoặc đã qua `userHasPermissionsInGroup` / `refreshUserPermissions` trong cùng process).
   */
  matchesAssigned(assignedCodes: Set<string>, need: string): boolean {
    return this.grants(assignedCodes, need);
  }

  /** User có mã `need` hoặc có quyền cha (theo parent_id) của `need`. */
  private grants(assignedCodes: Set<string>, need: string): boolean {
    if (assignedCodes.has(PERM.SYSTEM.MANAGE)) return true;

    if (assignedCodes.has(need)) return true;

    let cur = this.permissionByCodeCache.get(need) as any;
    while (cur?.parent_id) {
      const parent = this.permissionByIdCache.get(String(cur.parent_id)) as any;
      if (!parent) break;
      if (parent.code && assignedCodes.has(parent.code)) return true;
      cur = parent;
    }
    return false;
  }

  /** Chỉ mã quyền gán trực tiếp trên role (không suy diễn lên/xuống cây). */
  private async getDirectPermissionCodes(roleIds: any[]): Promise<Set<string>> {
    const links = await this.roleHasPermRepo.findMany({
      where: { role_id: { in: roleIds } },
      include: { permission: true },
    });

    const result = new Set<string>();
    for (const l of links) {
      const p = (l as any).permission;
      if (p?.status === 'active' && p.code) result.add(p.code);
    }
    return result;
  }
}

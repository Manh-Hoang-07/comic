import { Injectable, NotFoundException, BadRequestException, Inject, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { RbacCacheService } from '@/modules/core/rbac/services/rbac-cache.service';
import { IUserRoleAssignmentRepository, USER_ROLE_ASSIGNMENT_REPOSITORY } from '@/modules/core/rbac/user-role-assignment/domain/user-role-assignment.repository';
import { IRoleContextRepository, ROLE_CONTEXT_REPOSITORY } from '@/modules/core/rbac/role-context/domain/role-context.repository';
import { IGroupRepository, GROUP_REPOSITORY } from '@/modules/core/context/group/domain/group.repository';
import { toPrimaryKey } from '@/common/core/repositories/prisma-query.helper';
import { PERM } from '@/modules/core/rbac/rbac.constants';
import { IPermissionRepository, PERMISSION_REPOSITORY } from '@/modules/core/iam/permission/domain/permission.repository';

/**
 * Service quản lý RBAC (Role-Based Access Control)
 *
 * Cache Redis chỉ lưu các mã quyền được gán trực tiếp qua role.
 * Khi check route: đủ nếu user có đúng mã đó hoặc có bất kỳ quyền cha nào trên cây parent_id.
 */
@Injectable()
export class RbacService implements OnModuleInit, OnModuleDestroy {
  constructor(
    @Inject(USER_ROLE_ASSIGNMENT_REPOSITORY) private readonly assignmentRepo: IUserRoleAssignmentRepository,
    @Inject(ROLE_CONTEXT_REPOSITORY) private readonly roleContextRepo: IRoleContextRepository,
    @Inject(GROUP_REPOSITORY) private readonly groupRepo: IGroupRepository,
    @Inject(PERMISSION_REPOSITORY) private readonly permissionRepo: IPermissionRepository,
    private readonly rbacCache: RbacCacheService,
  ) { }

  private permissionById = new Map<string, { id: any; code: string; parent_id: any | null }>();
  private permissionByCode = new Map<string, { id: any; code: string; parent_id: any | null }>();
  private lastPermFetchMs = 0;
  private readonly permIndexTtlMs = 5 * 60 * 1000;
  private readonly prewarmIntervalMs = 4 * 60 * 1000;
  private permissionIndexRefreshInFlight: Promise<void> | null = null;
  private readonly refreshInFlight = new Map<string, Promise<Set<string>>>();
  private prewarmTimer: NodeJS.Timeout | null = null;

  async onModuleInit(): Promise<void> {
    await this.ensurePermissionIndexes().catch(() => undefined);
    this.prewarmTimer = setInterval(() => {
      void this.ensurePermissionIndexes().catch(() => undefined);
    }, this.prewarmIntervalMs);
  }

  onModuleDestroy(): void {
    if (this.prewarmTimer) {
      clearInterval(this.prewarmTimer);
      this.prewarmTimer = null;
    }
  }

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
    const read = await this.rbacCache.getPermissions(userId, groupId);
    if (read.cached) {
      return read.permissions;
    }
    return this.refreshUserPermissions(userId, groupId);
  }

  async refreshUserPermissions(userId: any, groupId: any | null): Promise<Set<string>> {
    const key = `${toPrimaryKey(userId)}:${groupId === null ? 'system' : toPrimaryKey(groupId)}`;
    const pending = this.refreshInFlight.get(key);
    if (pending) {
      await pending;
      return (await this.rbacCache.getPermissions(userId, groupId)).permissions;
    }

    const refreshPromise = (async () => {
      const codes = await this.assignmentRepo.findActivePermissionCodes(userId, groupId);
      const set = new Set(codes);
      await this.rbacCache.setPermissions(userId, groupId, [...set]);
      return set;
    })();

    this.refreshInFlight.set(key, refreshPromise);
    try {
      return await refreshPromise;
    } finally {
      this.refreshInFlight.delete(key);
    }
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

    await this.assignmentRepo.syncRolesInGroup(userId, groupId, roleIds);

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
    if (this.permissionById.size > 0 && Date.now() - this.lastPermFetchMs <= this.permIndexTtlMs) return;

    if (this.permissionIndexRefreshInFlight) {
      await this.permissionIndexRefreshInFlight;
      return;
    }

    this.permissionIndexRefreshInFlight = (async () => {
      const all = await this.permissionRepo.findActiveForRbacIndex();
      const byId = new Map<string, any>();
      const byCode = new Map<string, any>();
      for (const p of all as any[]) {
        byId.set(String(p.id), p);
        if (p.code) byCode.set(p.code, p);
      }
      this.permissionById = byId;
      this.permissionByCode = byCode;
      this.lastPermFetchMs = Date.now();
    })();

    try {
      await this.permissionIndexRefreshInFlight;
    } finally {
      this.permissionIndexRefreshInFlight = null;
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

    for (let cur = this.permissionByCode.get(need) as any; cur?.parent_id;) {
      const parent = this.permissionById.get(String(cur.parent_id)) as any;
      if (!parent) break;
      if (parent.code && assignedCodes.has(parent.code)) return true;
      cur = parent;
    }
    return false;
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { RbacCacheService } from '@/modules/core/rbac/services/rbac-cache.service';
import { toPrimaryKey } from '@/common/core/repositories/prisma-query.helper';
import { RbacPermissionIndexService } from '@/modules/core/rbac/services/rbac-permission-index.service';
import { RbacRoleAssignmentService } from '@/modules/core/rbac/services/rbac-role-assignment.service';
import { NullableRbacId, RbacId } from '@/modules/core/rbac/rbac.types';
import { RequestContext } from '@/common/shared/utils';

@Injectable()
export class RbacService {
  private readonly logger = new Logger(RbacService.name);

  constructor(
    private readonly rbacCache: RbacCacheService,
    private readonly permissionIndexService: RbacPermissionIndexService,
    private readonly roleAssignmentService: RbacRoleAssignmentService,
  ) { }

  private readonly refreshInFlight = new Map<string, Promise<Set<string>>>();

  async userHasPermissionsInGroup(userId: RbacId, groupId: NullableRbacId, required: string[]): Promise<boolean> {
    const startedAt = Date.now();
    await this.preparePermissionCheck();
    const scopes = this.buildScopeCandidates(groupId);
    const allowed = await this.hasAnyRequiredPermission(userId, required, scopes);
    this.logProfile(`check user=${toPrimaryKey(userId)} group=${groupId === null ? 'system' : toPrimaryKey(groupId)} scopes=${scopes.length} required=${required.length} allowed=${allowed} total=${Date.now() - startedAt}ms`);
    return allowed;
  }

  async getUserPermissions(userId: RbacId, groupId: NullableRbacId): Promise<Set<string>> {
    const requestCacheKey = this.buildRequestPermissionKey(userId, groupId);
    const reqCached = RequestContext.get<Set<string>>(requestCacheKey);
    if (reqCached) {
      return reqCached;
    }

    const startedAt = Date.now();
    const read = await this.rbacCache.getPermissions(userId, groupId);
    if (read.cached) {
      RequestContext.set(requestCacheKey, read.permissions);
      this.logProfile(`permissions user=${toPrimaryKey(userId)} group=${groupId === null ? 'system' : toPrimaryKey(groupId)} cache=L1/L2 size=${read.permissions.size} total=${Date.now() - startedAt}ms`);
      return read.permissions;
    }
    const refreshed = await this.refreshUserPermissions(userId, groupId);
    RequestContext.set(requestCacheKey, refreshed);
    this.logProfile(`permissions user=${toPrimaryKey(userId)} group=${groupId === null ? 'system' : toPrimaryKey(groupId)} cache=MISS size=${refreshed.size} total=${Date.now() - startedAt}ms`);
    return refreshed;
  }

  async refreshUserPermissions(userId: RbacId, groupId: NullableRbacId): Promise<Set<string>> {
    const startedAt = Date.now();
    const key = this.buildRefreshKey(userId, groupId);
    const pending = this.refreshInFlight.get(key);
    if (pending) {
      await pending;
      const fromCache = (await this.rbacCache.getPermissions(userId, groupId)).permissions;
      this.logProfile(`refresh user=${toPrimaryKey(userId)} group=${groupId === null ? 'system' : toPrimaryKey(groupId)} mode=wait_inflight size=${fromCache.size} total=${Date.now() - startedAt}ms`);
      return fromCache;
    }

    const refreshPromise = (async () => {
      const codes = await this.roleAssignmentService.getActivePermissionCodes(userId, groupId);
      const set = new Set(codes);
      await this.rbacCache.setPermissions(userId, groupId, [...set]);
      return set;
    })();

    this.refreshInFlight.set(key, refreshPromise);
    try {
      const result = await refreshPromise;
      this.logProfile(`refresh user=${toPrimaryKey(userId)} group=${groupId === null ? 'system' : toPrimaryKey(groupId)} mode=db_refresh size=${result.size} total=${Date.now() - startedAt}ms`);
      return result;
    } finally {
      this.refreshInFlight.delete(key);
    }
  }

  async assignRoleToUser(userId: RbacId, roleId: RbacId, groupId: RbacId): Promise<void> {
    await this.roleAssignmentService.assignRoleToUser(userId, roleId, groupId);
    await this.refreshUserPermissions(userId, groupId);
  }

  async syncRolesInGroup(userId: RbacId, groupId: RbacId, roleIds: RbacId[], skipValidation = false): Promise<void> {
    await this.roleAssignmentService.syncRolesInGroup(userId, groupId, roleIds, skipValidation);
    await this.refreshUserPermissions(userId, groupId);
  }

  private buildScopeCandidates(groupId: NullableRbacId): NullableRbacId[] {
    return groupId !== null ? [groupId, null] : [null];
  }

  private buildRefreshKey(userId: RbacId, groupId: NullableRbacId): string {
    return `${toPrimaryKey(userId)}:${groupId === null ? 'system' : toPrimaryKey(groupId)}`;
  }

  async preparePermissionCheck(): Promise<void> {
    const requestMarkerKey = 'rbac:permission-index:prepared';
    if (RequestContext.get<boolean>(requestMarkerKey)) {
      return;
    }
    const startedAt = Date.now();
    await this.permissionIndexService.preparePermissionCheck();
    RequestContext.set(requestMarkerKey, true);
    this.logProfile(`permission_index prepared_in=${Date.now() - startedAt}ms`);
  }

  matchesAssigned(assignedCodes: Set<string>, need: string): boolean {
    return this.permissionIndexService.matchesAssigned(assignedCodes, need);
  }

  private async hasAnyRequiredPermission(
    userId: RbacId,
    required: string[],
    scopes: NullableRbacId[],
  ): Promise<boolean> {
    for (const scope of scopes) {
      const permissions = await this.getUserPermissions(userId, scope);
      if (this.permissionIndexService.hasAnyRequiredFromAssigned(permissions, required)) return true;
    }
    return false;
  }

  private buildRequestPermissionKey(userId: RbacId, groupId: NullableRbacId): string {
    return `rbac:perm:${toPrimaryKey(userId)}:${groupId === null ? 'system' : toPrimaryKey(groupId)}`;
  }

  private logProfile(message: string): void {
    this.logger.log(`[RBAC_PROFILE] ${message}`);
  }
}

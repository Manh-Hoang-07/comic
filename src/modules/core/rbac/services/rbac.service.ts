import { Injectable } from '@nestjs/common';
import { RbacCacheService } from '@/modules/core/rbac/services/rbac-cache.service';
import { toPrimaryKey } from '@/common/core/repositories/prisma-query.helper';
import { RbacPermissionIndexService } from '@/modules/core/rbac/services/rbac-permission-index.service';
import { RbacRoleAssignmentService } from '@/modules/core/rbac/services/rbac-role-assignment.service';
import { NullableRbacId, RbacId } from '@/modules/core/rbac/rbac.types';
import { RequestContext } from '@/common/shared/utils';

@Injectable()
export class RbacService {
  constructor(
    private readonly rbacCache: RbacCacheService,
    private readonly permissionIndexService: RbacPermissionIndexService,
    private readonly roleAssignmentService: RbacRoleAssignmentService,
  ) { }

  private readonly refreshInFlight = new Map<string, Promise<Uint8Array>>();

  async userHasPermissionsInGroup(userId: RbacId, groupId: NullableRbacId, required: string[]): Promise<boolean> {
    await this.preparePermissionCheck();
    const scopes = this.buildScopeCandidates(groupId);
    const allowed = await this.hasAnyRequiredPermission(userId, required, scopes);
    return allowed;
  }

  async getUserPermissions(userId: RbacId, groupId: NullableRbacId): Promise<Uint8Array> {
    const requestCacheKey = this.buildRequestPermissionKey(userId, groupId);
    const reqCached = RequestContext.get<Uint8Array>(requestCacheKey);
    if (reqCached) {
      return reqCached;
    }

    const read = await this.rbacCache.getPermissions(userId, groupId);
    if (read.cached) {
      RequestContext.set(requestCacheKey, read.bitmap);
      return read.bitmap;
    }
    const refreshed = await this.refreshUserPermissions(userId, groupId);
    RequestContext.set(requestCacheKey, refreshed);
    return refreshed;
  }

  async refreshUserPermissions(userId: RbacId, groupId: NullableRbacId): Promise<Uint8Array> {
    const key = this.buildRefreshKey(userId, groupId);
    const pending = this.refreshInFlight.get(key);
    if (pending) {
      await pending;
      const fromCache = (await this.rbacCache.getPermissions(userId, groupId)).bitmap;
      return fromCache;
    }

    const refreshPromise = (async () => {
      await this.preparePermissionCheck();
      const codes = await this.roleAssignmentService.getActivePermissionCodes(userId, groupId);
      const bitmap = this.permissionIndexService.buildAssignedBitmap(codes);
      await this.rbacCache.setPermissions(userId, groupId, bitmap);
      return bitmap;
    })();

    this.refreshInFlight.set(key, refreshPromise);
    try {
      const result = await refreshPromise;
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
    return groupId !== null ? [groupId] : [null];
  }

  private buildRefreshKey(userId: RbacId, groupId: NullableRbacId): string {
    return `${toPrimaryKey(userId)}:${groupId === null ? 'system' : toPrimaryKey(groupId)}`;
  }

  async preparePermissionCheck(): Promise<void> {
    const requestMarkerKey = 'rbac:permission-index:prepared';
    if (RequestContext.get<boolean>(requestMarkerKey)) {
      return;
    }
    await this.permissionIndexService.preparePermissionCheck();
    RequestContext.set(requestMarkerKey, true);
  }

  matchesAssigned(assignedCodes: Set<string>, need: string): boolean {
    return this.permissionIndexService.matchesAssigned(assignedCodes, need);
  }

  matchesAssignedBitmap(bitmap: Uint8Array, need: string): boolean {
    return this.permissionIndexService.matchesAssignedBitmap(bitmap, need);
  }

  private async hasAnyRequiredPermission(
    userId: RbacId,
    required: string[],
    scopes: NullableRbacId[],
  ): Promise<boolean> {
    for (const scope of scopes) {
      const permissions = await this.getUserPermissions(userId, scope);
      if (this.permissionIndexService.hasAnyRequiredFromAssignedBitmap(permissions, required)) return true;
    }
    return false;
  }

  private buildRequestPermissionKey(userId: RbacId, groupId: NullableRbacId): string {
    return `rbac:perm:${toPrimaryKey(userId)}:${groupId === null ? 'system' : toPrimaryKey(groupId)}`;
  }
}

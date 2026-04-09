import { Injectable } from '@nestjs/common';
import { RbacCacheService } from '@/modules/core/rbac/services/rbac-cache.service';
import { toPrimaryKey } from '@/common/core/repositories/prisma-query.helper';
import { RbacPermissionIndexService } from '@/modules/core/rbac/services/rbac-permission-index.service';
import { RbacRoleAssignmentService } from '@/modules/core/rbac/services/rbac-role-assignment.service';
import { NullableRbacId, RbacId } from '@/modules/core/rbac/rbac.types';

@Injectable()
export class RbacService {
  constructor(
    private readonly rbacCache: RbacCacheService,
    private readonly permissionIndexService: RbacPermissionIndexService,
    private readonly roleAssignmentService: RbacRoleAssignmentService,
  ) { }

  private readonly refreshInFlight = new Map<string, Promise<Set<string>>>();

  async userHasPermissionsInGroup(userId: RbacId, groupId: NullableRbacId, required: string[]): Promise<boolean> {
    await this.permissionIndexService.preparePermissionCheck();
    const scopes = this.buildScopeCandidates(groupId);
    return this.hasAnyRequiredPermission(userId, required, scopes);
  }

  async getUserPermissions(userId: RbacId, groupId: NullableRbacId): Promise<Set<string>> {
    const read = await this.rbacCache.getPermissions(userId, groupId);
    if (read.cached) {
      return read.permissions;
    }
    return this.refreshUserPermissions(userId, groupId);
  }

  async refreshUserPermissions(userId: RbacId, groupId: NullableRbacId): Promise<Set<string>> {
    const key = this.buildRefreshKey(userId, groupId);
    const pending = this.refreshInFlight.get(key);
    if (pending) {
      await pending;
      return (await this.rbacCache.getPermissions(userId, groupId)).permissions;
    }

    const refreshPromise = (async () => {
      const codes = await this.roleAssignmentService.getActivePermissionCodes(userId, groupId);
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
    await this.permissionIndexService.preparePermissionCheck();
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
}

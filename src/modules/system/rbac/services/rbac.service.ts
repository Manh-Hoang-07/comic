import { Injectable } from '@nestjs/common';
import { RbacCacheService } from '@/modules/system/rbac/services/rbac-cache.service';
import { toPrimaryKey } from '@/common/core/repositories/prisma-query.helper';
import { RbacPermissionIndexService } from '@/modules/system/rbac/services/rbac-permission-index.service';
import { RbacRoleAssignmentService } from '@/modules/system/rbac/services/rbac-role-assignment.service';
import { NullableRbacId, RbacId } from '@/modules/system/rbac/rbac.types';
import { RequestContext } from '@/common/shared/utils';

function toAssignedSet(codes: Iterable<string>): Set<string> {
  return new Set(
    Array.from(codes).filter((c) => typeof c === 'string' && c.length > 0),
  );
}

@Injectable()
export class RbacService {
  constructor(
    private readonly rbacCache: RbacCacheService,
    private readonly permissionIndexService: RbacPermissionIndexService,
    private readonly roleAssignmentService: RbacRoleAssignmentService,
  ) {}

  private readonly refreshInFlight = new Map<string, Promise<Set<string>>>();

  async hasPermissions(
    userId: RbacId,
    groupId: NullableRbacId,
    required: string[],
  ): Promise<boolean> {
    // prepare() is already called by SecurityGuard before reaching here;
    // the RequestContext marker ensures it's a no-op if already done.
    const assigned = await this.getPermissions(userId, groupId);
    return this.permissionIndexService.hasAnyRequiredFromAssigned(
      assigned,
      required,
    );
  }

  async getPermissions(
    userId: RbacId,
    groupId: NullableRbacId,
  ): Promise<Set<string>> {
    const requestCacheKey = `rbac:perm:${this.scopeKey(userId, groupId)}`;
    const reqCached = RequestContext.get<Set<string>>(requestCacheKey);
    if (reqCached) {
      return reqCached;
    }

    const read = await this.rbacCache.getPermissions(userId, groupId);
    if (read.cached) {
      const set = toAssignedSet(read.codes);
      RequestContext.set(requestCacheKey, set);
      return set;
    }
    const refreshed = await this.refreshPermissions(userId, groupId);
    RequestContext.set(requestCacheKey, refreshed);
    return refreshed;
  }

  async refreshPermissions(
    userId: RbacId,
    groupId: NullableRbacId,
  ): Promise<Set<string>> {
    const key = this.scopeKey(userId, groupId);
    const pending = this.refreshInFlight.get(key);
    if (pending) {
      await pending;
      const fromCache = await this.rbacCache.getPermissions(userId, groupId);
      return toAssignedSet(fromCache.codes);
    }

    const refreshPromise = (async () => {
      await this.prepare();
      const codes = await this.roleAssignmentService.getActivePermissionCodes(
        userId,
        groupId,
      );
      const set = toAssignedSet(codes);
      await this.rbacCache.setPermissions(userId, groupId, Array.from(set));
      return set;
    })();

    this.refreshInFlight.set(key, refreshPromise);
    try {
      const result = await refreshPromise;
      return result;
    } finally {
      this.refreshInFlight.delete(key);
    }
  }

  async assignRoleToUser(
    userId: RbacId,
    roleId: RbacId,
    groupId: RbacId,
  ): Promise<void> {
    await this.roleAssignmentService.assignRoleToUser(userId, roleId, groupId);
    await this.refreshPermissions(userId, groupId);
  }

  async syncRolesInGroup(
    userId: RbacId,
    groupId: RbacId,
    roleIds: RbacId[],
    skipValidation = false,
  ): Promise<void> {
    await this.roleAssignmentService.syncRolesInGroup(
      userId,
      groupId,
      roleIds,
      skipValidation,
    );
    await this.refreshPermissions(userId, groupId);
  }

  private scopeKey(userId: RbacId, groupId: NullableRbacId): string {
    return `${toPrimaryKey(userId)}:${groupId === null ? 'system' : toPrimaryKey(groupId)}`;
  }

  async prepare(): Promise<void> {
    const requestMarkerKey = 'rbac:permission-index:prepared';
    if (RequestContext.get<boolean>(requestMarkerKey)) {
      return;
    }
    await this.permissionIndexService.prepare();
    RequestContext.set(requestMarkerKey, true);
  }

  hasCode(assigned: Set<string>, need: string): boolean {
    return this.permissionIndexService.matchesAssigned(assigned, need);
  }
}

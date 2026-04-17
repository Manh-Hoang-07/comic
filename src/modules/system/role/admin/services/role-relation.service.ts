import { Injectable, Inject } from '@nestjs/common';
import {
  IRoleRepository,
  ROLE_REPOSITORY,
} from '@/modules/system/role/domain/role.repository';
import { RbacCacheService } from '@/modules/system/rbac/services/rbac-cache.service';
import { normalizeIdArray } from '@/modules/system/rbac/utils/iam-transform.helper';

@Injectable()
export class RoleRelationService {
  constructor(
    @Inject(ROLE_REPOSITORY)
    private readonly roleRepo: IRoleRepository,
    private readonly rbacCache: RbacCacheService,
  ) {}

  /**
   * Gán permissions cho role
   */
  async syncPermissions(roleId: any, permissionIds: any[]) {
    await this.roleRepo.syncPermissions(roleId, permissionIds);
    await this.rbacCache.bumpVersion().catch(() => undefined);
  }

  /**
   * Dong bo contexts cho role
   */
  async syncContexts(roleId: any, rawContextIds: any) {
    const contextIds = normalizeIdArray(rawContextIds);
    if (contextIds !== null) {
      await this.roleRepo.syncContexts(roleId, contextIds);
    }
  }
}

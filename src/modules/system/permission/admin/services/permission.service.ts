import {
  Injectable,
  BadRequestException,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import {
  IPermissionRepository,
  PERMISSION_REPOSITORY,
} from '@/modules/system/permission/domain/permission.repository';
import { RbacCacheService } from '@/modules/system/rbac/services/rbac-cache.service';
import { BaseService } from '@/common/core/services';
import { transformPermission } from '@/modules/system/rbac/utils/iam-transform.helper';
import { getCurrentUserId } from '@/common/auth/utils/auth-context.helper';
import { toPrimaryKey } from '@/common/core/repositories/prisma-query.helper';
@Injectable()
export class PermissionService extends BaseService<any, IPermissionRepository> {
  constructor(
    @Inject(PERMISSION_REPOSITORY)
    private readonly permissionRepo: IPermissionRepository,
    private readonly rbacCache: RbacCacheService,
  ) {
    super(permissionRepo);
  }

  async getSimpleList(query: any) {
    return this.getList({ ...query, limit: 1000 });
  }

  // ── Lifecycle Hooks ────────────────────────────────────────────────────────

  protected override async beforeCreate(data: any) {
    const payload = { ...data };
    payload.created_user_id = getCurrentUserId();
    payload.updated_user_id = payload.created_user_id;

    if (payload.code && (await this.permissionRepo.findByCode(payload.code))) {
      throw new BadRequestException('Permission code already exists');
    }

    if (payload.parent_id) payload.parent_id = toPrimaryKey(payload.parent_id);

    return payload;
  }

  protected override async beforeUpdate(id: any, data: any) {
    const current = await this.permissionRepo.findById(id);
    if (!current) throw new NotFoundException('Permission not found');

    const payload = { ...data };
    payload.updated_user_id = getCurrentUserId();

    if (payload.code && payload.code !== current.code) {
      if (await this.permissionRepo.findByCode(payload.code)) {
        throw new BadRequestException('Permission code already exists');
      }
    }

    if (payload.parent_id) payload.parent_id = toPrimaryKey(payload.parent_id);

    return payload;
  }

  protected override async afterCreate() {
    await this.rbacCache.bumpVersion().catch(() => undefined);
  }

  protected override async afterUpdate() {
    await this.rbacCache.bumpVersion().catch(() => undefined);
  }

  protected override async beforeDelete(id: any): Promise<boolean> {
    const childrenCount = await this.permissionRepo.count({
      parent_id: toPrimaryKey(id),
    });
    if (childrenCount > 0)
      throw new BadRequestException('Cannot delete permission with children');
    return true;
  }

  protected override async afterDelete() {
    await this.rbacCache.bumpVersion().catch(() => undefined);
  }

  // ── Transformation ─────────────────────────────────────────────────────────

  protected override transform(permission: any) {
    if (!permission) return permission;
    const item = { ...permission } as any;

    if (item.parent) {
      item.parent = transformPermission(item.parent);
    }

    if (item.children) {
      item.children = (item.children as any[]).map(transformPermission);
    }

    return item;
  }
}

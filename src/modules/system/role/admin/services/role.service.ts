import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { RbacCacheService } from '@/modules/system/rbac/services/rbac-cache.service';
import { RequestContext } from '@/common/shared/utils';
import {
  IRoleRepository,
  ROLE_REPOSITORY,
} from '@/modules/system/role/domain/role.repository';
import {
  USER_ROLE_ASSIGNMENT_REPOSITORY,
  IUserRoleAssignmentRepository,
} from '@/modules/system/rbac/user-role-assignment/domain/user-role-assignment.repository';
import { BaseService } from '@/common/core/services';
import {
  transformPermission,
  resolveRoleContexts,
} from '@/modules/system/rbac/utils/iam-transform.helper';
import { getCurrentUserId } from '@/common/auth/utils/auth-context.helper';
import { toPrimaryKey } from '@/common/core/repositories/prisma-query.helper';
import { RoleRelationService } from './role-relation.service';

@Injectable()
export class RoleService extends BaseService<any, IRoleRepository> {
  constructor(
    @Inject(ROLE_REPOSITORY)
    private readonly roleRepo: IRoleRepository,
    @Inject(USER_ROLE_ASSIGNMENT_REPOSITORY)
    private readonly assignmentRepo: IUserRoleAssignmentRepository,
    private readonly rbacCache: RbacCacheService,
    private readonly relationService: RoleRelationService,
  ) {
    super(roleRepo);
  }

  protected override async prepareFilters(filter: any, _options?: any) {
    const context = RequestContext.get<any>('context');
    const contextId = RequestContext.get<any>('contextId');

    if (context?.type === 'system') {
      return filter;
    }

    if (!contextId) {
      throw new BadRequestException(
        'Context ID is required to access roles in non-system scope',
      );
    }

    return { ...filter, contextId };
  }

  // ── CRUD Operations ───────────────────────────────────────────────────────

  async assignPermissions(roleId: any, permissionIds: any[]) {
    await this.verifyRoleExistence(roleId);
    await this.relationService.syncPermissions(roleId, permissionIds);
    return this.getOne(roleId);
  }

  // ── Lifecycle Hooks ────────────────────────────────────────────────────────

  protected override async beforeCreate(data: any) {
    const { context_ids: _context_ids, ...payload } = data;
    payload.created_user_id = getCurrentUserId();

    if (payload.code && (await this.roleRepo.findByCode(payload.code))) {
      throw new BadRequestException('Role code already exists');
    }

    if (
      payload.parent_id !== undefined &&
      payload.parent_id !== null &&
      payload.parent_id !== ''
    ) {
      payload.parent = { connect: { id: toPrimaryKey(payload.parent_id) } };
      delete payload.parent_id;
    }

    return payload;
  }

  protected override async beforeUpdate(id: any, data: any) {
    const current = await this.verifyRoleExistence(id);
    const { context_ids: _context_ids, ...payload } = data;
    payload.updated_user_id = getCurrentUserId();

    if (payload.code && payload.code !== current.code) {
      if (await this.roleRepo.findByCode(payload.code)) {
        throw new BadRequestException('Role code already exists');
      }
    }

    if (payload.parent_id !== undefined) {
      if (payload.parent_id === null || payload.parent_id === '') {
        payload.parent = { disconnect: true };
      } else {
        payload.parent = { connect: { id: toPrimaryKey(payload.parent_id) } };
      }
      delete payload.parent_id;
    }

    return payload;
  }

  protected override async afterCreate(entity: any, data: any) {
    await this.relationService.syncContexts(entity.id, data.context_ids);
    await this.rbacCache.bumpVersion().catch(() => undefined);
  }

  protected override async afterUpdate(entity: any, data: any) {
    await this.relationService.syncContexts(entity.id, data.context_ids);
    await this.rbacCache.bumpVersion().catch(() => undefined);
  }

  protected override async beforeDelete(id: any): Promise<boolean> {
    const childrenCount = await this.roleRepo.count({
      parent_id: toPrimaryKey(id),
    });
    if (childrenCount > 0)
      throw new BadRequestException('Cannot delete role with children');

    const userCount = await this.assignmentRepo.count({
      role_id: toPrimaryKey(id),
    });
    if (userCount > 0)
      throw new BadRequestException('Cannot delete role assigned to users');

    return true;
  }

  protected override async afterDelete() {
    await this.rbacCache.bumpVersion().catch(() => undefined);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private async verifyRoleExistence(id: any) {
    const role = await this.roleRepo.findById(id);
    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  // ── Transformation ────────────────────────────────────────────────────────

  protected override transform(role: any) {
    if (!role) return role;
    const item = { ...role } as any;

    if (item.parent) {
      item.parent = transformPermission(item.parent);
    }

    if (item.children) {
      item.children = item.children.map(transformPermission);
    }

    if (item.permissions) {
      item.permissions = (item.permissions as any[])
        .map((link) => transformPermission(link.permission))
        .filter(Boolean);
    }

    const { context_ids, contexts } = resolveRoleContexts(
      item.role_contexts || [],
    );
    item.context_ids = context_ids;
    item.contexts = contexts;
    delete item.role_contexts;

    return item;
  }
}

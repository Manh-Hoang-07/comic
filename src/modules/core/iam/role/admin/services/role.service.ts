import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { RbacCacheService } from '@/modules/core/rbac/services/rbac-cache.service';
import { RequestContext } from '@/common/shared/utils';
import { IRoleRepository, ROLE_REPOSITORY } from '@/modules/core/iam/role/domain/role.repository';
import { USER_ROLE_ASSIGNMENT_REPOSITORY, IUserRoleAssignmentRepository } from '@/modules/core/rbac/user-role-assignment/domain/user-role-assignment.repository';
import { BaseService } from '@/common/core/services';
import { normalizeIdArray, transformPermission, resolveRoleContexts } from '@/modules/core/iam/utils/iam-transform.helper';
import { getCurrentUserId } from '@/common/auth/utils/auth-context.helper';
import { toPrimaryKey } from '@/common/core/repositories/prisma-query.helper';
@Injectable()
export class RoleService extends BaseService<any, IRoleRepository> {
  constructor(
    @Inject(ROLE_REPOSITORY)
    private readonly roleRepo: IRoleRepository,
    @Inject(USER_ROLE_ASSIGNMENT_REPOSITORY)
    private readonly assignmentRepo: IUserRoleAssignmentRepository,
    private readonly rbacCache: RbacCacheService,
  ) {
    super(roleRepo);
  }

  protected override async prepareFilters(filter: any) {
    const context = RequestContext.get<any>('context');
    const contextId = RequestContext.get<any>('contextId');

    // Nếu là system context (ngữ cảnh toàn cục) -> Cứ để filter tự do (không đè)
    if (context?.type === 'system') {
      return filter;
    }

    // Ngữ cảnh cục bộ -> bắt buộc phải ép chặt filter vào contextId hiện tại
    if (!contextId) {
      throw new BadRequestException('Context ID is required to access roles in non-system scope');
    }

    return { ...filter, contextId };
  }

  // ── Extended CRUD Operations ───────────────────────────────────────────────

  async getSimpleList(query: any) {
    return this.getList({ ...query, limit: 1000 });
  }

  async assignPermissions(roleId: any, permissionIds: any[]) {
    await this.verifyRoleExistence(roleId);
    await this.roleRepo.syncPermissions(roleId, permissionIds);
    await this.rbacCache.bumpVersion().catch(() => undefined);

    return this.getOne(roleId);
  }

  // ── Lifecycle Hooks ────────────────────────────────────────────────────────

  protected override async beforeCreate(data: any) {
    const { context_ids, ...payload } = data;
    payload.created_user_id = getCurrentUserId();

    if (payload.code && (await this.roleRepo.findByCode(payload.code))) {
      throw new BadRequestException('Role code already exists');
    }

    // Transform parent_id to Prisma relation
    if (payload.parent_id !== undefined && payload.parent_id !== null && payload.parent_id !== '') {
      payload.parent = { connect: { id: toPrimaryKey(payload.parent_id) } };
      delete payload.parent_id;
    }

    return payload;
  }

  async create(data: any) {
    const { context_ids } = data;
    const contextIds = normalizeIdArray(context_ids);
    const role = await super.create(data);

    if (contextIds?.length) {
      await this.roleRepo.syncContexts(role.id, contextIds);
    }
    await this.rbacCache.bumpVersion().catch(() => undefined);
    return this.getOne(role.id);
  }

  protected override async beforeUpdate(id: any, data: any) {
    const current = await this.verifyRoleExistence(id);
    const { context_ids, ...payload } = data;
    payload.updated_user_id = getCurrentUserId();

    if (payload.code && payload.code !== current.code) {
      if (await this.roleRepo.findByCode(payload.code)) {
        throw new BadRequestException('Role code already exists');
      }
    }

    // Transform parent_id to Prisma relation
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

  async update(id: any, data: any) {
    const { context_ids } = data;
    const contextIds = normalizeIdArray(context_ids);
    const role = await super.update(id, data);

    if (contextIds !== null) {
      await this.roleRepo.syncContexts(id, contextIds);
    }
    await this.rbacCache.bumpVersion().catch(() => undefined);
    return this.getOne(id);
  }

  protected override async beforeDelete(id: any): Promise<boolean> {
    const childrenCount = await this.roleRepo.count({ parent_id: toPrimaryKey(id) });
    if (childrenCount > 0) throw new BadRequestException('Cannot delete role with children');

    const userCount = await this.assignmentRepo.count({ role_id: toPrimaryKey(id) });
    if (userCount > 0) throw new BadRequestException('Cannot delete role assigned to users');

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

    // Handle Contexts
    const { context_ids, contexts } = resolveRoleContexts(item.role_contexts || []);
    item.context_ids = context_ids;
    item.contexts = contexts;
    delete item.role_contexts;

    return item;
  }
}


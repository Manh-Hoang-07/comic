import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { RbacCacheService } from '@/modules/core/rbac/services/rbac-cache.service';
import { RequestContext } from '@/common/shared/utils';
import { IRoleRepository, ROLE_REPOSITORY } from '@/modules/core/iam/role/domain/role.repository';
import { USER_ROLE_ASSIGNMENT_REPOSITORY, IUserRoleAssignmentRepository } from '@/modules/core/rbac/user-role-assignment/domain/user-role-assignment.repository';
import { BaseService } from '@/common/core/services';
import { normalizeIdArray, transformPermission, resolveRoleContexts } from '@/modules/core/iam/utils/iam-transform.helper';
import { getCurrentUserId } from '@/common/auth/utils/auth-context.helper';

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
    const contextId = RequestContext.get<number>('contextId') || 1;

    // Filter by contextId if not in system context
    if (context && context.type !== 'system') {
      return { ...filter, contextId };
    }
    return filter;
  }

  // ── Extended CRUD Operations ───────────────────────────────────────────────

  async getSimpleList(query: any) {
    return this.getList({ ...query, limit: 1000 });
  }

  async assignPermissions(roleId: number | bigint, permissionIds: number[]) {
    await this.verifyRoleExistence(roleId);
    await this.roleRepo.syncPermissions(roleId, permissionIds);
    await this.rbacCache.bumpVersion().catch(() => undefined);

    return this.getOne(roleId);
  }

  // ── Lifecycle Hooks ────────────────────────────────────────────────────────

  protected override async beforeCreate(data: any) {
    const payload = { ...data };
    payload.created_user_id = getCurrentUserId();

    if (payload.code && (await this.roleRepo.findByCode(payload.code))) {
      throw new BadRequestException('Role code already exists');
    }

    // parent_id should be BigInt
    if (payload.parent_id) payload.parent_id = BigInt(payload.parent_id);

    return payload;
  }

  async create(data: any) {
    const contextIds = normalizeIdArray(data.context_ids);
    const role = await super.create(data);

    if (contextIds?.length) {
      await this.roleRepo.syncContexts(role.id, contextIds);
    }
    return this.getOne(role.id);
  }

  protected override async beforeUpdate(id: number | bigint, data: any) {
    const current = await this.verifyRoleExistence(id);
    const payload = { ...data };
    payload.updated_user_id = getCurrentUserId();

    if (payload.code && payload.code !== current.code) {
      if (await this.roleRepo.findByCode(payload.code)) {
        throw new BadRequestException('Role code already exists');
      }
    }

    if (payload.parent_id) payload.parent_id = BigInt(payload.parent_id);

    return payload;
  }

  async update(id: number | bigint, data: any) {
    const contextIds = normalizeIdArray(data.context_ids);
    const role = await super.update(id, data);

    if (contextIds !== null) {
      await this.roleRepo.syncContexts(id, contextIds);
    }
    return this.getOne(id);
  }

  protected override async beforeDelete(id: number | bigint): Promise<boolean> {
    const childrenCount = await this.roleRepo.count({ parent_id: BigInt(id) });
    if (childrenCount > 0) throw new BadRequestException('Cannot delete role with children');

    const userCount = await this.assignmentRepo.count({ role_id: BigInt(id) });
    if (userCount > 0) throw new BadRequestException('Cannot delete role assigned to users');

    return true;
  }

  protected override async afterDelete() {
    await this.rbacCache.bumpVersion().catch(() => undefined);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private async verifyRoleExistence(id: number | bigint) {
    const role = await this.roleRepo.findById(id);
    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  protected override transform(role: any) {
    if (!role) return role;
    const item = this.deepConvertBigInt(role) as any;

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

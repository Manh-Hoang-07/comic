import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { RequestContext } from '@/common/shared/utils';
import { toPrimaryKey } from '@/common/core/repositories/prisma-query.helper';
import { IUserRepository, USER_REPOSITORY } from '@/modules/core/user/domain/user.repository';
import { GROUP_REPOSITORY, IGroupRepository } from '@/modules/core/context/group/domain/group.repository';
import { PolicyService } from './policy.service';
import { GroupCatalogService, GroupCatalogItem } from '@/modules/core/rbac/catalog/group-catalog.service';
import { RoleCatalogService } from '@/modules/core/rbac/catalog/role-catalog.service';
import { RoleContextCatalogService } from '@/modules/core/rbac/catalog/role-context-catalog.service';
import { RbacService } from '@/modules/core/rbac/services/rbac.service';

/**
 * Gán / xem role của user (catalog, tree, batch sync).
 * Tách khỏi {@link UserService} để tránh phình service CRUD user.
 */
@Injectable()
export class UserRolesService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepo: IUserRepository,
    @Inject(GROUP_REPOSITORY)
    private readonly groupRepo: IGroupRepository,
    private readonly policy: PolicyService,
    private readonly groupCatalog: GroupCatalogService,
    private readonly roleCatalog: RoleCatalogService,
    private readonly roleContextCatalog: RoleContextCatalogService,
    private readonly rbacService: RbacService,
  ) {}

  async getUserRoles(id: any, _groupIds?: any) {
    await this.policy.assertAccess(id);

    const { assignmentGroupPks } = await this.resolveRoleUiScope(id);
    if (assignmentGroupPks.length === 0) {
      return [];
    }

    const assignments = await this.userRepo.findAssignments(id, assignmentGroupPks);
    const grouped = new Map<any, any>();

    for (const assignment of assignments) {
      const groupId = assignment.group_id;
      if (!grouped.has(groupId)) {
        grouped.set(groupId, {
          group_id: groupId,
          group_code: assignment.group?.code,
          group_name: assignment.group?.name,
          roles: [],
        });
      }

      const groupEntry = grouped.get(groupId);
      const isExistedRole = groupEntry.roles.some((role: any) => role.role_id === assignment.role_id);
      if (!isExistedRole) {
        groupEntry.roles.push({
          role_id: assignment.role_id,
          role_code: assignment.role?.code,
          role_name: assignment.role?.name,
        });
      }
    }

    return Array.from(grouped.values());
  }

  /**
   * Cây group → role (catalog theo context + tick assignment).
   * - Context **system**: các **nhóm mà tài khoản đang xem là thành viên** (user_groups, group active).
   * - Context **khác**: chỉ **group hiện tại** (RequestContext.groupId).
   */
  async getUserRolesTree(id: any, _groupIds?: string) {
    const user = await this.userRepo.findById(id);
    if (!user) throw new NotFoundException('User not found');

    await this.policy.assertAccess(id);

    const { groups, assignmentGroupPks } = await this.resolveRoleUiScope(id);
    if (groups.length === 0) {
      return [];
    }

    /** context_id + context (type/code) từ DB — bắt cặp với role_contexts theo id hoặc theo mã context. */
    const dbContextByGroupId = new Map<string, string>();
    const groupRowById = new Map<string, { context?: { type?: string; code?: string } }>();
    const contextTypeCodePairs: { type: string; code: string }[] = [];
    if (groups.length > 0) {
      const rows = await this.groupRepo.findActiveByIds(groups.map((g) => toPrimaryKey(g.id)));
      for (const row of rows as {
        id: unknown;
        context_id: unknown;
        context?: { type?: string; code?: string };
      }[]) {
        const gid = String(toPrimaryKey(row.id));
        groupRowById.set(gid, row);
        if (row.context_id != null && row.context_id !== '') {
          dbContextByGroupId.set(gid, String(toPrimaryKey(row.context_id)));
        }
        const c = row.context;
        if (c?.type != null && c?.code != null && String(c.type) !== '' && String(c.code) !== '') {
          contextTypeCodePairs.push({ type: String(c.type), code: String(c.code) });
        }
      }
    }

    const contextIds = groups.map((g) => dbContextByGroupId.get(g.id) ?? g.contextId);
    const [assignments, allRoles, roleIdsByContext, roleIdsByTypeCode] = await Promise.all([
      this.userRepo.findAssignments(id, assignmentGroupPks),
      this.roleCatalog.getAllActiveRoles(),
      this.roleContextCatalog.getRoleIdsMapForContextsFromDb(contextIds),
      this.roleContextCatalog.getRoleIdsMapForContextTypeCodesFromDb(contextTypeCodePairs),
    ]);

    const assignedByGroup = new Map<string, Set<string>>();
    for (const a of assignments) {
      const gid = String(toPrimaryKey(a.group_id));
      if (!assignedByGroup.has(gid)) assignedByGroup.set(gid, new Set());
      assignedByGroup.get(gid)!.add(String(toPrimaryKey(a.role_id)));
    }

    const roleById = new Map(allRoles.map((r) => [r.id, r]));

    const tree: Array<{
      group_id: number;
      group_name: string;
      checked: boolean;
      indeterminate: boolean;
      roles: Array<{ role_id: number; role_name: string | null; checked: boolean }>;
    }> = [];

    for (const g of groups) {
      const effectiveCtx = dbContextByGroupId.get(g.id) ?? g.contextId;
      const ctxKey =
        effectiveCtx != null && effectiveCtx !== '' ? String(toPrimaryKey(effectiveCtx)) : '';
      const row = groupRowById.get(g.id);
      const c = row?.context;
      const tcKey =
        c?.type != null && c?.code != null && String(c.type) !== '' && String(c.code) !== ''
          ? `${String(c.type)}\0${String(c.code)}`
          : '';
      const fromByContextId = ctxKey ? (roleIdsByContext.get(ctxKey) ?? []) : [];
      const fromByTypeCode = tcKey ? (roleIdsByTypeCode.get(tcKey) ?? []) : [];
      const fromContext = [...new Set([...fromByContextId.map(String), ...fromByTypeCode.map(String)])];
      const assigned = assignedByGroup.get(g.id) ?? new Set();

      const idSet = new Set<string>([...fromContext.map(String), ...assigned]);
      const sorted = [...idSet].sort((a, b) => {
        const na = Number(a);
        const nb = Number(b);
        if (Number.isFinite(na) && Number.isFinite(nb) && na !== nb) return na - nb;
        return a.localeCompare(b);
      });

      let checkedCount = 0;
      const roles = sorted.map((rid) => {
        const meta = roleById.get(rid);
        const checked = assigned.has(rid);
        if (checked) checkedCount += 1;
        return {
          role_id: Number(rid),
          role_name: meta?.name ?? null,
          checked,
        };
      });

      const n = roles.length;
      const checked = n > 0 && checkedCount === n;
      const indeterminate = checkedCount > 0 && checkedCount < n;

      tree.push({
        group_id: Number(g.id),
        group_name: g.name,
        checked,
        indeterminate,
        roles,
      });
    }

    return tree;
  }

  /**
   * System: nhóm active mà user là member + catalog tương ứng.
   * Non-system: đúng một nhóm = groupId trong request context.
   */
  private async resolveRoleUiScope(targetUserId: any): Promise<{
    groups: GroupCatalogItem[];
    assignmentGroupPks: any[];
  }> {
    const context = RequestContext.get<{ type?: string } | null>('context');
    const ctxGroupId = RequestContext.get<any>('groupId');

    if (context?.type === 'system') {
      const memberIds = await this.userRepo.findMemberGroupIds(targetUserId);
      const groups = await this.groupCatalog.getGroupsByIds(memberIds);
      return {
        groups,
        assignmentGroupPks: memberIds.map((x) => toPrimaryKey(x)),
      };
    }

    if (ctxGroupId === undefined || ctxGroupId === null) {
      throw new ForbiddenException('No context available');
    }

    const groups = await this.groupCatalog.getGroupsByIds([ctxGroupId]);
    return {
      groups,
      assignmentGroupPks: [toPrimaryKey(ctxGroupId)],
    };
  }

  /** Đồng bộ role theo nhiều group trong một request. */
  async batchSyncUserRoles(id: any, items: Array<{ group_id: any; role_ids: any[] }>) {
    const user = await this.userRepo.findById(id);
    if (!user) throw new NotFoundException('User not found');

    await this.policy.assertAccess(id);

    if (!Array.isArray(items)) {
      throw new BadRequestException('Body must be a JSON array of { group_id, role_ids }');
    }

    this.assertBatchGroupsAllowed(items);

    for (const raw of items) {
      if (raw == null || typeof raw !== 'object') {
        throw new BadRequestException('Each batch item must be an object');
      }
      if (raw.group_id === undefined || raw.group_id === null) {
        throw new BadRequestException('Each item must include group_id');
      }
      if (!Array.isArray(raw.role_ids)) {
        throw new BadRequestException('Each item must include role_ids as an array');
      }
    }

    const isSystemContext = RequestContext.get<{ type?: string } | null>('context')?.type === 'system';

    const lastByGroup = new Map<string, { group_id: any; role_ids: any[] }>();
    for (const it of items) {
      lastByGroup.set(String(toPrimaryKey(it.group_id)), it);
    }

    for (const it of lastByGroup.values()) {
      await this.rbacService.syncRolesInGroup(id, it.group_id, it.role_ids ?? [], isSystemContext);
    }

    return { success: true };
  }

  private assertBatchGroupsAllowed(items: Array<{ group_id: any }>): void {
    const context = RequestContext.get<any>('context');
    if (context?.type === 'system') return;

    const ctxGroupId = RequestContext.get<any>('groupId');
    if (ctxGroupId === undefined || ctxGroupId === null) {
      throw new ForbiddenException('No context available');
    }

    const ctxPk = String(toPrimaryKey(ctxGroupId));
    for (const it of items) {
      if (String(toPrimaryKey(it.group_id)) !== ctxPk) {
        throw new ForbiddenException('group_id is not allowed in the current context');
      }
    }
  }
}

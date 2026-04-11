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
  ) { }

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
    const { groups, assignmentGroupPks } = await this.resolveRoleUiScope(id);
    if (groups.length === 0) return [];

    await this.policy.assertAccess(id);

    // 1. Phách dữ liệu cơ sở (Groups từ DB, Assignments, Meta Roles)
    const [groupDetailRows, assignments, allRoles] = await this.fetchBaseData(id, groups, assignmentGroupPks);

    const groupRowMap = new Map(groupDetailRows.map((r: any) => [String(toPrimaryKey(r.id)), r]));
    const roleMap = new Map(allRoles.map(r => [r.id, r]));

    // 2. Lấy Role Catalog cho tất cả các context liên quan
    const { rolesByContextMap, rolesByTypeCodeMap } = await this.fetchRoleContextMappings(groups, groupRowMap);

    // 3. Gom nhóm assignments
    const assignedByGroupMap = this.groupAssignments(assignments);

    // 4. Lắp ghép cây kết quả
    return groups.map((g) => {
      const detail = groupRowMap.get(g.id);
      const ctxId = detail?.context_id ? String(toPrimaryKey(detail.context_id)) : g.contextId;
      const tcKey = (detail?.context?.type && detail?.context?.code) 
        ? `${detail.context.type}\0${detail.context.code}` 
        : null;

      const roleIdsFromCatalog = new Set([
        ...(ctxId ? (rolesByContextMap.get(ctxId) ?? []) : []),
        ...(tcKey ? (rolesByTypeCodeMap.get(tcKey) ?? []) : []),
      ]);

      const assignedRoleIds = assignedByGroupMap.get(g.id) ?? new Set<string>();

      return this.buildGroupNode(g, roleIdsFromCatalog, assignedRoleIds, roleMap);
    });
  }

  /** Lấy dữ liệu cơ bản song song */
  private async fetchBaseData(id: any, groups: any[], assignmentGroupPks: any[]) {
    return Promise.all([
      this.groupRepo.findActiveByIds(groups.map(g => toPrimaryKey(g.id))),
      this.userRepo.findAssignments(id, assignmentGroupPks),
      this.roleCatalog.getAllActiveRoles(),
    ]);
  }

  /** Tra cứu Catalog tập trung cho tất cả context IDs và Type/Code pairs */
  private async fetchRoleContextMappings(groups: any[], groupRowMap: Map<string, any>) {
    const contextIds = new Set<string>();
    const typeCodePairs: { type: string; code: string }[] = [];

    for (const g of groups) {
      const detail = groupRowMap.get(g.id);
      const ctxId = detail?.context_id ? String(toPrimaryKey(detail.context_id)) : g.contextId;
      if (ctxId) contextIds.add(ctxId);

      const c = detail?.context;
      if (c?.type && c?.code) typeCodePairs.push({ type: c.type, code: c.code });
    }

    const [rolesByContextMap, rolesByTypeCodeMap] = await Promise.all([
      this.roleContextCatalog.getRoleIdsMapForContextsFromDb([...contextIds]),
      this.roleContextCatalog.getRoleIdsMapForContextTypeCodesFromDb(typeCodePairs),
    ]);

    return { rolesByContextMap, rolesByTypeCodeMap };
  }

  /** Phân loại assignments theo group_id */
  private groupAssignments(assignments: any[]): Map<string, Set<string>> {
    const map = new Map<string, Set<string>>();
    for (const a of assignments) {
      const gid = String(toPrimaryKey(a.group_id));
      if (!map.has(gid)) map.set(gid, new Set());
      map.get(gid)!.add(String(toPrimaryKey(a.role_id)));
    }
    return map;
  }

  /** Xây dựng cấu trúc của một Group Node trong cây */
  private buildGroupNode(g: any, roleIdsFromCatalog: Set<string>, assignedRoleIds: Set<string>, roleMap: Map<string, any>) {
    // Sắp xếp ID Role (Catalog-driven)
    const sortedIds = [...roleIdsFromCatalog].sort((a, b) => {
      const na = Number(a), nb = Number(b);
      return (Number.isFinite(na) && Number.isFinite(nb)) ? na - nb : a.localeCompare(b);
    });

    let checkedCount = 0;
    const roles = sortedIds.map((rid) => {
      const isChecked = assignedRoleIds.has(rid);
      if (isChecked) checkedCount++;
      return {
        role_id: Number(rid),
        role_name: roleMap.get(rid)?.name ?? null,
        checked: isChecked,
      };
    });

    return {
      group_id: Number(g.id),
      group_name: g.name,
      checked: roles.length > 0 && checkedCount === roles.length,
      indeterminate: checkedCount > 0 && checkedCount < roles.length,
      roles,
    };
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

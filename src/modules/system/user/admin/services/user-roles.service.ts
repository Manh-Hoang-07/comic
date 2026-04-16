import {
  BadRequestException,
  Injectable,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import type { PrimaryKey } from '@/common/core/utils/primary-key.util';
import { toPrimaryKey } from '@/common/core/repositories/prisma-query.helper';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '@/modules/system/user/domain/user.repository';
import {
  IRoleRepository,
  ROLE_REPOSITORY,
} from '@/modules/system/role/domain/role.repository';
import {
  IRoleContextRepository,
  ROLE_CONTEXT_REPOSITORY,
} from '@/modules/system/rbac/role-context/domain/role-context.repository';
import { PolicyService } from './policy.service';
import { RbacService } from '@/modules/system/rbac/services/rbac.service';
import { isSysCtx } from '@/common/shared/utils/request-group-context.util';
import {
  UserRoleScopeService,
  type RbacUiGroup,
} from './user-role-scope.service';

export type { RbacUiGroup };

type RbacUiRole = {
  id: string;
  code: string;
  name: string | null;
  status: string;
  parentId: string | null;
};

/**
 * Gán / xem role của user (tree, batch sync).
 * Tách khỏi {@link UserService} để tránh phình service CRUD user.
 */
@Injectable()
export class UserRolesService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepo: IUserRepository,
    @Inject(ROLE_REPOSITORY)
    private readonly roleRepo: IRoleRepository,
    @Inject(ROLE_CONTEXT_REPOSITORY)
    private readonly roleContextRepo: IRoleContextRepository,
    private readonly policy: PolicyService,
    private readonly rbacService: RbacService,
    private readonly roleScope: UserRoleScopeService,
  ) {}

  async getUserRoles(id: PrimaryKey, _groupIds?: string) {
    await this.policy.assertAccess(id);

    const { assignmentGroupPks } = await this.roleScope.resolveRoleUi(id);
    if (assignmentGroupPks.length === 0) {
      return [];
    }

    const assignments = await this.userRepo.findAssignments(
      id,
      assignmentGroupPks,
    );
    const grouped = new Map<
      any,
      {
        group_id: any;
        group_code: any;
        group_name: any;
        roles: any[];
        seenRole: Set<string>;
      }
    >();

    for (const assignment of assignments) {
      const groupId = assignment.group_id;
      if (!grouped.has(groupId)) {
        grouped.set(groupId, {
          group_id: groupId,
          group_code: assignment.group?.code,
          group_name: assignment.group?.name,
          roles: [],
          seenRole: new Set(),
        });
      }

      const groupEntry = grouped.get(groupId)!;
      const rk = String(toPrimaryKey(assignment.role_id));
      if (groupEntry.seenRole.has(rk)) continue;
      groupEntry.seenRole.add(rk);
      groupEntry.roles.push({
        role_id: assignment.role_id,
        role_code: assignment.role?.code,
        role_name: assignment.role?.name,
      });
    }

    return Array.from(grouped.values()).map(
      ({ seenRole: _s, ...rest }) => rest,
    );
  }

  async getUserRolesTree(id: PrimaryKey, _groupIds?: string) {
    const user = await this.userRepo.findById(id);
    if (!user) throw new NotFoundException('User not found');

    const { groups, assignmentGroupPks, groupRows } =
      await this.roleScope.resolveRoleUi(id);
    if (groups.length === 0) return [];

    await this.policy.assertAccess(id);

    const [assignments, allRoles] = await this.fetchAssignmentsAndAllRoles(
      id,
      assignmentGroupPks,
    );
    const groupDetailRows = groupRows;

    const groupRowMap = new Map(
      groupDetailRows.map((r: any) => [String(toPrimaryKey(r.id)), r]),
    );
    const roleMap = new Map(allRoles.map((r) => [r.id, r]));

    const { rolesByContextMap, rolesByTypeCodeMap } =
      await this.fetchRoleContextMappings(groups, groupRowMap);

    const assignedByGroupMap = this.groupAssignments(assignments);

    return groups.map((g) => {
      const detail = groupRowMap.get(g.id);
      const ctxId = detail?.context_id
        ? String(toPrimaryKey(detail.context_id))
        : g.contextId;
      const tcKey =
        detail?.context?.type && detail?.context?.code
          ? `${detail.context.type}\0${detail.context.code}`
          : null;

      const roleIdsFromCatalog = new Set([
        ...(ctxId ? (rolesByContextMap.get(ctxId) ?? []) : []),
        ...(tcKey ? (rolesByTypeCodeMap.get(tcKey) ?? []) : []),
      ]);

      const assignedRoleIds = assignedByGroupMap.get(g.id) ?? new Set<string>();

      return this.buildGroupNode(
        g,
        roleIdsFromCatalog,
        assignedRoleIds,
        roleMap,
      );
    });
  }

  private fetchAssignmentsAndAllRoles(
    id: PrimaryKey,
    assignmentGroupPks: PrimaryKey[],
  ) {
    return Promise.all([
      this.userRepo.findAssignments(id, assignmentGroupPks),
      this.loadAllActiveRoles(),
    ]);
  }

  private async loadAllActiveRoles(): Promise<RbacUiRole[]> {
    const rows = await this.roleRepo.findMany({ status: 'active' } as any);
    return (rows as any[]).map((r) => ({
      id: String(r.id),
      code: r.code,
      name: r.name ?? null,
      status: r.status,
      parentId: r.parent_id != null ? String(r.parent_id) : null,
    }));
  }

  private async fetchRoleContextMappings(
    groups: any[],
    groupRowMap: Map<string, any>,
  ) {
    const contextIds = new Set<string>();
    const typeCodePairs: { type: string; code: string }[] = [];

    for (const g of groups) {
      const detail = groupRowMap.get(g.id);
      const ctxId = detail?.context_id
        ? String(toPrimaryKey(detail.context_id))
        : g.contextId;
      if (ctxId) contextIds.add(ctxId);

      const c = detail?.context;
      if (c?.type && c?.code)
        typeCodePairs.push({ type: c.type, code: c.code });
    }

    const [rolesByContextMap, rolesByTypeCodeMap] = await Promise.all([
      this.loadRoleIdsMapForContexts([...contextIds]),
      this.loadRoleIdsMapForContextTypeCodes(typeCodePairs),
    ]);

    return { rolesByContextMap, rolesByTypeCodeMap };
  }

  private async loadRoleIdsMapForContexts(
    contextIds: readonly string[],
  ): Promise<Map<string, string[]>> {
    const unique = [
      ...new Set(
        contextIds.filter((x) => x && x !== 'undefined' && x !== 'null'),
      ),
    ];
    const out = new Map<string, string[]>();
    if (unique.length === 0) return out;

    const links = await this.roleContextRepo.findMany({
      where: {
        context_id: { in: unique.map((id) => toPrimaryKey(id)) },
        role: { status: 'active' as any },
      },
      select: { context_id: true, role_id: true },
    });
    for (const rc of links as any[]) {
      const ctxId = String(rc.context_id);
      const roleId = String(rc.role_id);
      const list = out.get(ctxId) ?? [];
      list.push(roleId);
      out.set(ctxId, list);
    }
    for (const [k, v] of out) {
      const sorted = [...new Set(v)].sort((a, b) => {
        const na = Number(a);
        const nb = Number(b);
        if (Number.isFinite(na) && Number.isFinite(nb) && na !== nb)
          return na - nb;
        return a.localeCompare(b);
      });
      out.set(k, sorted);
    }
    return out;
  }

  private async loadRoleIdsMapForContextTypeCodes(
    pairs: ReadonlyArray<{ type: string; code: string }>,
  ): Promise<Map<string, string[]>> {
    const uniq = new Map<string, { type: string; code: string }>();
    for (const p of pairs) {
      if (!p?.type || !p?.code) continue;
      const k = `${p.type}\0${p.code}`;
      uniq.set(k, { type: p.type, code: p.code });
    }
    const out = new Map<string, string[]>();
    if (uniq.size === 0) return out;

    const or = [...uniq.values()].map((p) => ({ type: p.type, code: p.code }));

    const links = await this.roleContextRepo.findMany({
      where: {
        role: { status: 'active' as any },
        context: { OR: or },
      },
      select: {
        role_id: true,
        context: { select: { type: true, code: true } },
      },
    });

    for (const rc of links as any[]) {
      const c = rc.context;
      if (!c?.type || !c?.code) continue;
      const k = `${String(c.type)}\0${String(c.code)}`;
      const rid = String(rc.role_id);
      const list = out.get(k) ?? [];
      list.push(rid);
      out.set(k, list);
    }
    for (const [k, v] of out) {
      const sorted = [...new Set(v)].sort((a, b) => {
        const na = Number(a);
        const nb = Number(b);
        if (Number.isFinite(na) && Number.isFinite(nb) && na !== nb)
          return na - nb;
        return a.localeCompare(b);
      });
      out.set(k, sorted);
    }
    return out;
  }

  private groupAssignments(assignments: any[]): Map<string, Set<string>> {
    const map = new Map<string, Set<string>>();
    for (const a of assignments) {
      const gid = String(toPrimaryKey(a.group_id));
      if (!map.has(gid)) map.set(gid, new Set());
      map.get(gid)!.add(String(toPrimaryKey(a.role_id)));
    }
    return map;
  }

  private buildGroupNode(
    g: any,
    roleIdsFromCatalog: Set<string>,
    assignedRoleIds: Set<string>,
    roleMap: Map<string, any>,
  ) {
    const sortedIds = [...roleIdsFromCatalog].sort((a, b) => {
      const na = Number(a),
        nb = Number(b);
      return Number.isFinite(na) && Number.isFinite(nb)
        ? na - nb
        : a.localeCompare(b);
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

  async batchSyncUserRoles(
    id: PrimaryKey,
    items: Array<{ group_id: PrimaryKey; role_ids: PrimaryKey[] }>,
  ) {
    const user = await this.userRepo.findById(id);
    if (!user) throw new NotFoundException('User not found');

    await this.policy.assertAccess(id);

    if (!Array.isArray(items)) {
      throw new BadRequestException(
        'Body must be a JSON array of { group_id, role_ids }',
      );
    }

    this.roleScope.guardBatchGroups(items);

    for (const raw of items) {
      if (raw == null || typeof raw !== 'object') {
        throw new BadRequestException('Each batch item must be an object');
      }
      if (raw.group_id === undefined || raw.group_id === null) {
        throw new BadRequestException('Each item must include group_id');
      }
      if (!Array.isArray(raw.role_ids)) {
        throw new BadRequestException(
          'Each item must include role_ids as an array',
        );
      }
    }

    const sys = isSysCtx();
    const lastByGroup = new Map<
      string,
      { group_id: PrimaryKey; role_ids: PrimaryKey[] }
    >();
    for (const it of items) {
      lastByGroup.set(String(toPrimaryKey(it.group_id)), it);
    }

    await Promise.all(
      [...lastByGroup.values()].map((it) =>
        this.rbacService.syncRolesInGroup(
          id,
          it.group_id,
          it.role_ids ?? [],
          sys,
        ),
      ),
    );

    return { success: true };
  }
}

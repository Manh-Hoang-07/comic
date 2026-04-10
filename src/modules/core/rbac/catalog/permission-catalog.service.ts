import { Inject, Injectable } from '@nestjs/common';
import { RedisUtil } from '@/core/utils/redis.util';
import { IPermissionRepository, PERMISSION_REPOSITORY } from '@/modules/core/iam/permission/domain/permission.repository';
import { IRoleHasPermissionRepository, ROLE_HAS_PERMISSION_REPOSITORY } from '@/modules/core/rbac/role-has-permission/domain/role-has-permission.repository';
import { RequestContext } from '@/common/shared/utils';
import { L1TtlCache } from '@/modules/core/rbac/catalog/l1-ttl-cache';
import { RBAC_CATALOG_TTL_SEC, RbacCatalogKeys } from '@/modules/core/rbac/catalog/rbac-catalog.keys';

export type PermissionCatalogItem = {
  code: string;
  parentCode: string | null;
};

@Injectable()
export class PermissionCatalogService {
  private readonly l1PermNodes = new L1TtlCache<PermissionCatalogItem[]>(60000);
  private readonly l1RolePerm = new L1TtlCache<Map<string, string[]>>(60000);

  constructor(
    @Inject(PERMISSION_REPOSITORY) private readonly permissionRepo: IPermissionRepository,
    @Inject(ROLE_HAS_PERMISSION_REPOSITORY) private readonly roleHasPermRepo: IRoleHasPermissionRepository,
    private readonly redis: RedisUtil,
  ) {}

  async getAllActivePermissions(): Promise<PermissionCatalogItem[]> {
    const reqKey = 'rbac:catalog:perm:all';
    const reqCached = RequestContext.get<PermissionCatalogItem[]>(reqKey);
    if (reqCached) return reqCached;

    const l1 = this.l1PermNodes.getValid();
    if (l1) {
      RequestContext.set(reqKey, l1);
      return l1;
    }

    const fromRedis = await this.loadPermsFromRedis();
    if (fromRedis) {
      this.l1PermNodes.set(fromRedis);
      RequestContext.set(reqKey, fromRedis);
      return fromRedis;
    }

    const fromDb = await this.loadPermsFromDb();
    if (this.redis.isEnabled()) {
      await this.writePermsToRedis(fromDb).catch(() => undefined);
    }
    this.l1PermNodes.set(fromDb);
    RequestContext.set(reqKey, fromDb);
    return fromDb;
  }

  async getRolePermissionMapping(): Promise<Map<string, string[]>> {
    const reqKey = 'rbac:catalog:role_perm:all';
    const reqCached = RequestContext.get<Map<string, string[]>>(reqKey);
    if (reqCached) return reqCached;

    const l1 = this.l1RolePerm.getValid();
    if (l1) {
      RequestContext.set(reqKey, l1);
      return l1;
    }

    const fromRedis = await this.loadRolePermFromRedis();
    if (fromRedis) {
      this.l1RolePerm.set(fromRedis);
      RequestContext.set(reqKey, fromRedis);
      return fromRedis;
    }

    const fromDb = await this.loadRolePermFromDb();
    if (this.redis.isEnabled()) {
      await this.writeRolePermToRedis(fromDb).catch(() => undefined);
    }
    this.l1RolePerm.set(fromDb);
    RequestContext.set(reqKey, fromDb);
    return fromDb;
  }

  async getPermissionCodesForRoleIds(roleIds: any[]): Promise<string[]> {
    if (!Array.isArray(roleIds) || roleIds.length === 0) return [];
    const map = await this.getRolePermissionMapping();
    const out = new Set<string>();
    for (const rid of roleIds) {
      const k = String(rid);
      const codes = map.get(k);
      if (!codes) continue;
      for (const c of codes) out.add(c);
    }
    return Array.from(out);
  }

  async refreshAll(): Promise<void> {
    const perms = await this.loadPermsFromDb();
    const rolePerm = await this.loadRolePermFromDb();
    this.l1PermNodes.clear();
    this.l1RolePerm.clear();
    if (!this.redis.isEnabled()) return;
    await this.writePermsToRedis(perms);
    await this.writeRolePermToRedis(rolePerm);
  }

  private async loadPermsFromRedis(): Promise<PermissionCatalogItem[] | null> {
    if (!this.redis.isEnabled()) return null;
    const codesRaw = await this.redis.get(RbacCatalogKeys.permCodes);
    if (!codesRaw) return null;
    const hash = await this.redis.hgetall(RbacCatalogKeys.permByCode);
    if (!hash || Object.keys(hash).length === 0) return null;
    let codes: string[];
    try {
      codes = JSON.parse(codesRaw) as string[];
    } catch {
      return null;
    }
    const out: PermissionCatalogItem[] = [];
    for (const code of codes) {
      const raw = hash[code];
      if (!raw) continue;
      try {
        out.push(JSON.parse(raw) as PermissionCatalogItem);
      } catch {
        /* ignore */
      }
    }
    return out;
  }

  private async loadRolePermFromRedis(): Promise<Map<string, string[]> | null> {
    if (!this.redis.isEnabled()) return null;
    const hash = await this.redis.hgetall(RbacCatalogKeys.rolePermByRole);
    if (!hash || Object.keys(hash).length === 0) return null;
    const out = new Map<string, string[]>();
    for (const [roleId, raw] of Object.entries(hash)) {
      try {
        const parsed = JSON.parse(raw) as string[];
        out.set(roleId, parsed);
      } catch {
        out.set(roleId, []);
      }
    }
    return out;
  }

  private async loadPermsFromDb(): Promise<PermissionCatalogItem[]> {
    const nodes = await this.permissionRepo.findActiveForRbacIndex();
    const byId = new Map<string, { code: string; parent_id: any | null }>();
    for (const n of nodes as any[]) {
      byId.set(String(n.id), { code: n.code, parent_id: n.parent_id ?? null });
    }
    const byCode = new Map<string, PermissionCatalogItem>();
    for (const n of nodes as any[]) {
      const parent = n.parent_id != null ? byId.get(String(n.parent_id)) : null;
      byCode.set(n.code, { code: n.code, parentCode: parent?.code ?? null });
    }
    return [...byCode.values()].sort((a, b) => a.code.localeCompare(b.code));
  }

  private async loadRolePermFromDb(): Promise<Map<string, string[]>> {
    const links = await this.roleHasPermRepo.findMany({
      where: {
        role: { status: 'active' as any },
        permission: { status: 'active' as any },
      },
      include: { permission: { select: { code: true } } },
    });
    const out = new Map<string, string[]>();
    for (const r of links as any[]) {
      const roleId = String(r.role_id);
      const code = r?.permission?.code;
      if (typeof code !== 'string' || code.length === 0) continue;
      const list = out.get(roleId) ?? [];
      list.push(code);
      out.set(roleId, list);
    }
    // stable order + de-dup
    for (const [k, v] of out) {
      const uniq = Array.from(new Set(v));
      uniq.sort((a, b) => a.localeCompare(b));
      out.set(k, uniq);
    }
    return out;
  }

  private async writePermsToRedis(perms: PermissionCatalogItem[]): Promise<void> {
    const codes = perms.map((p) => p.code);
    const byCode: Record<string, string> = {};
    for (const p of perms) byCode[p.code] = JSON.stringify(p);

    await this.redis.withPipeline((p) => {
      (p as any).del(RbacCatalogKeys.permByCode);
      (p as any).del(RbacCatalogKeys.permCodes);
      for (const [field, value] of Object.entries(byCode)) {
        (p as any).hset(RbacCatalogKeys.permByCode, field, value);
      }
      (p as any).set(RbacCatalogKeys.permCodes, JSON.stringify(codes), 'EX', RBAC_CATALOG_TTL_SEC);
      (p as any).expire(RbacCatalogKeys.permByCode, RBAC_CATALOG_TTL_SEC);
    });
  }

  private async writeRolePermToRedis(map: Map<string, string[]>): Promise<void> {
    const entries: Record<string, string> = {};
    for (const [roleId, codes] of map) entries[roleId] = JSON.stringify(codes);

    await this.redis.withPipeline((p) => {
      (p as any).del(RbacCatalogKeys.rolePermByRole);
      for (const [field, value] of Object.entries(entries)) {
        (p as any).hset(RbacCatalogKeys.rolePermByRole, field, value);
      }
      (p as any).expire(RbacCatalogKeys.rolePermByRole, RBAC_CATALOG_TTL_SEC);
    });
  }
}


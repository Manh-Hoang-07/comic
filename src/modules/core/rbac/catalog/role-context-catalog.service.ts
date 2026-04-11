import { Inject, Injectable } from '@nestjs/common';
import { RedisUtil } from '@/core/utils/redis.util';
import { toPrimaryKey } from '@/common/core/repositories/prisma-query.helper';
import { IRoleContextRepository, ROLE_CONTEXT_REPOSITORY } from '@/modules/core/rbac/role-context/domain/role-context.repository';
import { RequestContext } from '@/common/shared/utils';
import { L1TtlCache } from '@/modules/core/rbac/catalog/l1-ttl-cache';
import { RBAC_CATALOG_TTL_SEC, RbacCatalogKeys } from '@/modules/core/rbac/catalog/rbac-catalog.keys';

@Injectable()
export class RoleContextCatalogService {
  private readonly l1All = new L1TtlCache<Map<string, string[]>>(60000);

  constructor(
    @Inject(ROLE_CONTEXT_REPOSITORY) private readonly roleContextRepo: IRoleContextRepository,
    private readonly redis: RedisUtil,
  ) {}

  async getRoleIdsAllowedInContext(contextId: any): Promise<string[]> {
    if (contextId === undefined || contextId === null) {
      return [];
    }
    const ctxId = String(contextId);
    if (ctxId === 'undefined' || ctxId === 'null') {
      return [];
    }

    const reqKey = `rbac:catalog:role_ctx:${ctxId}`;
    const reqCached = RequestContext.get<string[]>(reqKey);
    if (reqCached) return reqCached;

    const l1 = this.l1All.getValid();
    if (l1?.has(ctxId)) {
      const v = await this.reconcileStaleEmpty(ctxId, l1.get(ctxId)!);
      RequestContext.set(reqKey, v);
      return v;
    }

    const all = await this.getAllFromCacheOrDb();
    let v = all.get(ctxId) ?? [];
    v = await this.reconcileStaleEmpty(ctxId, v);
    RequestContext.set(reqKey, v);
    return v;
  }

  /**
   * Redis/L1 có thể giữ field `[]` sau seed/migrate trong khi DB đã có `role_contexts`.
   * Không tin cache rỗng: đối chiếu DB một lần và ghi lại L1 + Redis nếu DB có dữ liệu.
   */
  private async reconcileStaleEmpty(ctxId: string, cached: string[]): Promise<string[]> {
    if (cached.length > 0) {
      return cached;
    }
    const fresh = await this.loadAllFromDb();
    const dbV = fresh.get(ctxId) ?? [];
    if (dbV.length === 0) {
      return cached;
    }
    this.l1All.set(fresh);
    if (this.redis.isEnabled()) {
      await this.writeAllToRedis(fresh).catch(() => undefined);
    }
    return dbV;
  }

  /**
   * Một query DB theo nhiều context — dùng cho UI tree (không phụ thuộc Redis/L1).
   * Key map: String(context_id) từ DB.
   */
  async getRoleIdsMapForContextsFromDb(contextIds: readonly any[]): Promise<Map<string, string[]>> {
    const unique = [
      ...new Set(
        contextIds
          .filter((x) => x !== undefined && x !== null && x !== '')
          .map((id) => String(toPrimaryKey(id))),
      ),
    ];
    const out = new Map<string, string[]>();
    if (unique.length === 0) {
      return out;
    }

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
        if (Number.isFinite(na) && Number.isFinite(nb) && na !== nb) return na - nb;
        return a.localeCompare(b);
      });
      out.set(k, sorted);
    }
    return out;
  }

  /**
   * Role theo (context.type, context.code) — bổ sung khi `context_id` trên group lệch bản ghi đã seed
   * `role_contexts` nhưng vẫn cùng mã logic (vd. code `group`).
   * Không lọc status context (chỉ role active) để tree admin vẫn thấy catalog.
   */
  async getRoleIdsMapForContextTypeCodesFromDb(
    pairs: ReadonlyArray<{ type: string; code: string }>,
  ): Promise<Map<string, string[]>> {
    const uniq = new Map<string, { type: string; code: string }>();
    for (const p of pairs) {
      if (!p?.type || !p?.code) continue;
      const k = `${p.type}\0${p.code}`;
      uniq.set(k, { type: p.type, code: p.code });
    }
    const out = new Map<string, string[]>();
    if (uniq.size === 0) {
      return out;
    }

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
        if (Number.isFinite(na) && Number.isFinite(nb) && na !== nb) return na - nb;
        return a.localeCompare(b);
      });
      out.set(k, sorted);
    }
    return out;
  }

  async refreshAll(): Promise<void> {
    const map = await this.loadAllFromDb();
    this.l1All.clear();
    if (!this.redis.isEnabled()) return;
    await this.writeAllToRedis(map);
  }

  private async getAllFromCacheOrDb(): Promise<Map<string, string[]>> {
    const l1 = this.l1All.getValid();
    if (l1) return l1;

    const fromRedis = await this.loadAllFromRedis();
    if (fromRedis) {
      this.l1All.set(fromRedis);
      return fromRedis;
    }

    const fromDb = await this.loadAllFromDb();
    if (this.redis.isEnabled()) {
      await this.writeAllToRedis(fromDb).catch(() => undefined);
    }
    this.l1All.set(fromDb);
    return fromDb;
  }

  private async loadAllFromRedis(): Promise<Map<string, string[]> | null> {
    if (!this.redis.isEnabled()) return null;
    const hash = await this.redis.hgetall(RbacCatalogKeys.roleCtxByContext);
    if (!hash || Object.keys(hash).length === 0) return null;
    const out = new Map<string, string[]>();
    for (const [ctxId, raw] of Object.entries(hash)) {
      try {
        out.set(ctxId, JSON.parse(raw) as string[]);
      } catch {
        out.set(ctxId, []);
      }
    }
    return out;
  }

  private async loadAllFromDb(): Promise<Map<string, string[]>> {
    const links = await this.roleContextRepo.findMany({
      where: {
        role: { status: 'active' as any },
        context: { status: 'active' as any },
      },
    });
    const out = new Map<string, string[]>();
    for (const rc of links as any[]) {
      const ctxId = String(rc.context_id);
      const roleId = String(rc.role_id);
      const list = out.get(ctxId) ?? [];
      list.push(roleId);
      out.set(ctxId, list);
    }
    // stable ordering
    for (const [k, v] of out) out.set(k, v.sort((a, b) => a.localeCompare(b)));
    return out;
  }

  private async writeAllToRedis(map: Map<string, string[]>): Promise<void> {
    const entries: Record<string, string> = {};
    for (const [ctxId, roleIds] of map) {
      entries[ctxId] = JSON.stringify(roleIds);
    }
    await this.redis.withPipeline((p) => {
      (p as any).del(RbacCatalogKeys.roleCtxByContext);
      for (const [field, value] of Object.entries(entries)) {
        (p as any).hset(RbacCatalogKeys.roleCtxByContext, field, value);
      }
      (p as any).expire(RbacCatalogKeys.roleCtxByContext, RBAC_CATALOG_TTL_SEC);
    });
  }
}


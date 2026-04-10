import { Inject, Injectable } from '@nestjs/common';
import { RedisUtil } from '@/core/utils/redis.util';
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
    const ctxId = String(contextId);
    const reqKey = `rbac:catalog:role_ctx:${ctxId}`;
    const reqCached = RequestContext.get<string[]>(reqKey);
    if (reqCached) return reqCached;

    const l1 = this.l1All.getValid();
    if (l1?.has(ctxId)) {
      const v = l1.get(ctxId)!;
      RequestContext.set(reqKey, v);
      return v;
    }

    if (this.redis.isEnabled()) {
      const raw = await this.redis.hget(RbacCatalogKeys.roleCtxByContext, ctxId);
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as string[];
          const next = l1 ?? new Map<string, string[]>();
          next.set(ctxId, parsed);
          this.l1All.set(next);
          RequestContext.set(reqKey, parsed);
          return parsed;
        } catch {
          /* load fallback */
        }
      }
    }

    const all = await this.getAllFromCacheOrDb();
    const v = all.get(ctxId) ?? [];
    RequestContext.set(reqKey, v);
    return v;
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


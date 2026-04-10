import { Inject, Injectable } from '@nestjs/common';
import { RedisUtil } from '@/core/utils/redis.util';
import { IContextRepository, CONTEXT_REPOSITORY } from '@/modules/core/context/context/domain/context.repository';
import { RequestContext } from '@/common/shared/utils';
import { L1TtlCache } from '@/modules/core/rbac/catalog/l1-ttl-cache';
import { RBAC_CATALOG_TTL_SEC, RbacCatalogKeys } from '@/modules/core/rbac/catalog/rbac-catalog.keys';

export type ContextCatalogItem = {
  id: string;
  type: string;
  ref_id: string | null;
  code: string;
  name: string;
  status: string;
};

@Injectable()
export class ContextCatalogService {
  private readonly l1All = new L1TtlCache<ContextCatalogItem[]>(60000);

  constructor(
    @Inject(CONTEXT_REPOSITORY) private readonly contextRepo: IContextRepository,
    private readonly redis: RedisUtil,
  ) {}

  async getAllActiveContexts(): Promise<ContextCatalogItem[]> {
    const reqKey = 'rbac:catalog:ctx:all';
    const reqCached = RequestContext.get<ContextCatalogItem[]>(reqKey);
    if (reqCached) return reqCached;

    const l1 = this.l1All.getValid();
    if (l1) {
      RequestContext.set(reqKey, l1);
      return l1;
    }

    const fromRedis = await this.loadAllFromRedis();
    if (fromRedis) {
      this.l1All.set(fromRedis);
      RequestContext.set(reqKey, fromRedis);
      return fromRedis;
    }

    const fromDb = await this.loadAllFromDb();
    if (this.redis.isEnabled()) {
      await this.writeAllToRedis(fromDb).catch(() => undefined);
    }
    this.l1All.set(fromDb);
    RequestContext.set(reqKey, fromDb);
    return fromDb;
  }

  async refreshAll(): Promise<void> {
    const rows = await this.loadAllFromDb();
    this.l1All.clear();
    if (!this.redis.isEnabled()) return;
    await this.writeAllToRedis(rows);
  }

  private async loadAllFromRedis(): Promise<ContextCatalogItem[] | null> {
    if (!this.redis.isEnabled()) return null;
    const idsRaw = await this.redis.get(RbacCatalogKeys.ctxIds);
    if (!idsRaw) return null;
    const hash = await this.redis.hgetall(RbacCatalogKeys.ctxById);
    if (!hash || Object.keys(hash).length === 0) return null;
    let ids: string[];
    try {
      ids = JSON.parse(idsRaw) as string[];
    } catch {
      return null;
    }
    const out: ContextCatalogItem[] = [];
    for (const id of ids) {
      const raw = hash[id];
      if (!raw) continue;
      try {
        out.push(JSON.parse(raw) as ContextCatalogItem);
      } catch {
        /* ignore */
      }
    }
    return out;
  }

  private async loadAllFromDb(): Promise<ContextCatalogItem[]> {
    const rows = await this.contextRepo.findManyRaw({
      where: { status: 'active' as any },
      select: { id: true, type: true, ref_id: true, code: true, name: true, status: true },
      orderBy: { id: 'asc' } as any,
    });
    return (rows as any[]).map((c) => ({
      id: String(c.id),
      type: c.type,
      ref_id: c.ref_id != null ? String(c.ref_id) : null,
      code: c.code,
      name: c.name,
      status: c.status,
    }));
  }

  private async writeAllToRedis(rows: ContextCatalogItem[]): Promise<void> {
    const ids = rows.map((r) => r.id);
    const byId: Record<string, string> = {};
    for (const r of rows) byId[r.id] = JSON.stringify(r);

    await this.redis.withPipeline((p) => {
      // Replace snapshot keys.
      (p as any).del(RbacCatalogKeys.ctxById);
      (p as any).del(RbacCatalogKeys.ctxIds);
      for (const [field, value] of Object.entries(byId)) {
        (p as any).hset(RbacCatalogKeys.ctxById, field, value);
      }
      (p as any).set(RbacCatalogKeys.ctxIds, JSON.stringify(ids), 'EX', RBAC_CATALOG_TTL_SEC);
      (p as any).expire(RbacCatalogKeys.ctxById, RBAC_CATALOG_TTL_SEC);
    });
  }
}


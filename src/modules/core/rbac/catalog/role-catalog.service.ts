import { Inject, Injectable } from '@nestjs/common';
import { RedisUtil } from '@/core/utils/redis.util';
import { IRoleRepository, ROLE_REPOSITORY } from '@/modules/core/iam/role/domain/role.repository';
import { RequestContext } from '@/common/shared/utils';
import { L1TtlCache } from '@/modules/core/rbac/catalog/l1-ttl-cache';
import { RBAC_CATALOG_TTL_SEC, RbacCatalogKeys } from '@/modules/core/rbac/catalog/rbac-catalog.keys';

export type RoleCatalogItem = {
  id: string;
  code: string;
  name: string | null;
  status: string;
  parentId: string | null;
};

@Injectable()
export class RoleCatalogService {
  private readonly l1All = new L1TtlCache<RoleCatalogItem[]>(60000);

  constructor(
    @Inject(ROLE_REPOSITORY) private readonly roleRepo: IRoleRepository,
    private readonly redis: RedisUtil,
  ) {}

  async getAllActiveRoles(): Promise<RoleCatalogItem[]> {
    const reqKey = 'rbac:catalog:role:all';
    const reqCached = RequestContext.get<RoleCatalogItem[]>(reqKey);
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

  private async loadAllFromRedis(): Promise<RoleCatalogItem[] | null> {
    if (!this.redis.isEnabled()) return null;
    const idsRaw = await this.redis.get(RbacCatalogKeys.roleIds);
    if (!idsRaw) return null;
    const hash = await this.redis.hgetall(RbacCatalogKeys.roleById);
    if (!hash || Object.keys(hash).length === 0) return null;
    let ids: string[];
    try {
      ids = JSON.parse(idsRaw) as string[];
    } catch {
      return null;
    }
    const out: RoleCatalogItem[] = [];
    for (const id of ids) {
      const raw = hash[id];
      if (!raw) continue;
      try {
        out.push(JSON.parse(raw) as RoleCatalogItem);
      } catch {
        /* ignore */
      }
    }
    return out;
  }

  private async loadAllFromDb(): Promise<RoleCatalogItem[]> {
    const rows = await this.roleRepo.findManyRaw({
      where: { status: 'active' as any },
      select: { id: true, code: true, name: true, status: true, parent_id: true },
      orderBy: { id: 'asc' } as any,
    });
    return (rows as any[]).map((r) => ({
      id: String(r.id),
      code: r.code,
      name: r.name ?? null,
      status: r.status,
      parentId: r.parent_id != null ? String(r.parent_id) : null,
    }));
  }

  private async writeAllToRedis(rows: RoleCatalogItem[]): Promise<void> {
    const ids = rows.map((r) => r.id);
    const byId: Record<string, string> = {};
    for (const r of rows) byId[r.id] = JSON.stringify(r);

    await this.redis.withPipeline((p) => {
      (p as any).del(RbacCatalogKeys.roleById);
      (p as any).del(RbacCatalogKeys.roleIds);
      for (const [field, value] of Object.entries(byId)) {
        (p as any).hset(RbacCatalogKeys.roleById, field, value);
      }
      (p as any).set(RbacCatalogKeys.roleIds, JSON.stringify(ids), 'EX', RBAC_CATALOG_TTL_SEC);
      (p as any).expire(RbacCatalogKeys.roleById, RBAC_CATALOG_TTL_SEC);
    });
  }
}


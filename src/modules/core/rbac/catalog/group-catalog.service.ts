import { Inject, Injectable } from '@nestjs/common';
import { RedisUtil } from '@/core/utils/redis.util';
import { IGroupRepository, GROUP_REPOSITORY } from '@/modules/core/context/group/domain/group.repository';
import { RequestContext } from '@/common/shared/utils';
import { L1TtlCache } from '@/modules/core/rbac/catalog/l1-ttl-cache';
import { RBAC_CATALOG_TTL_SEC, RbacCatalogKeys } from '@/modules/core/rbac/catalog/rbac-catalog.keys';
import { toPrimaryKey } from '@/common/core/repositories/prisma-query.helper';

export type GroupCatalogItem = {
  id: string;
  code: string;
  type: string;
  name: string;
  status: string;
  contextId: string;
};

@Injectable()
export class GroupCatalogService {
  private readonly l1All = new L1TtlCache<GroupCatalogItem[]>(60000);
  private readonly l1ById = new L1TtlCache<Map<string, GroupCatalogItem>>(60000);

  constructor(
    @Inject(GROUP_REPOSITORY) private readonly groupRepo: IGroupRepository,
    private readonly redis: RedisUtil,
  ) {}

  async getGroupById(groupId: any): Promise<GroupCatalogItem | null> {
    const id = String(toPrimaryKey(groupId));
    const reqKey = `rbac:catalog:grp:by_id:${id}`;
    const reqCached = RequestContext.get<GroupCatalogItem | null>(reqKey);
    if (reqCached !== undefined) return reqCached;

    const map = this.l1ById.getValid();
    if (map?.has(id)) {
      const v = map.get(id)!;
      RequestContext.set(reqKey, v);
      return v;
    }

    if (this.redis.isEnabled()) {
      const raw = await this.redis.hget(RbacCatalogKeys.grpById, id);
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as GroupCatalogItem;
          const nextMap = map ?? new Map<string, GroupCatalogItem>();
          nextMap.set(id, parsed);
          this.l1ById.set(nextMap);
          RequestContext.set(reqKey, parsed);
          return parsed;
        } catch {
          /* load fallback */
        }
      }
    }

    const all = await this.getAllActiveGroups();
    const found = all.find((g) => g.id === id) ?? null;
    RequestContext.set(reqKey, found);
    return found;
  }

  async getAllActiveGroups(): Promise<GroupCatalogItem[]> {
    const reqKey = 'rbac:catalog:grp:all';
    const reqCached = RequestContext.get<GroupCatalogItem[]>(reqKey);
    if (reqCached) return reqCached;

    const l1 = this.l1All.getValid();
    if (l1) {
      RequestContext.set(reqKey, l1);
      return l1;
    }

    const fromRedis = await this.loadAllFromRedis();
    if (fromRedis) {
      this.l1All.set(fromRedis);
      this.l1ById.set(new Map(fromRedis.map((g) => [g.id, g])));
      RequestContext.set(reqKey, fromRedis);
      return fromRedis;
    }

    const fromDb = await this.loadAllFromDb();
    if (this.redis.isEnabled()) {
      await this.writeAllToRedis(fromDb).catch(() => undefined);
    }
    this.l1All.set(fromDb);
    this.l1ById.set(new Map(fromDb.map((g) => [g.id, g])));
    RequestContext.set(reqKey, fromDb);
    return fromDb;
  }

  async refreshAll(): Promise<void> {
    const rows = await this.loadAllFromDb();
    this.l1All.clear();
    this.l1ById.clear();
    if (!this.redis.isEnabled()) return;
    await this.writeAllToRedis(rows);
  }

  private async loadAllFromRedis(): Promise<GroupCatalogItem[] | null> {
    if (!this.redis.isEnabled()) return null;
    const idsRaw = await this.redis.get(RbacCatalogKeys.grpIds);
    if (!idsRaw) return null;
    const hash = await this.redis.hgetall(RbacCatalogKeys.grpById);
    if (!hash || Object.keys(hash).length === 0) return null;
    let ids: string[];
    try {
      ids = JSON.parse(idsRaw) as string[];
    } catch {
      return null;
    }
    const out: GroupCatalogItem[] = [];
    for (const id of ids) {
      const raw = hash[id];
      if (!raw) continue;
      try {
        out.push(JSON.parse(raw) as GroupCatalogItem);
      } catch {
        /* ignore */
      }
    }
    return out;
  }

  private async loadAllFromDb(): Promise<GroupCatalogItem[]> {
    const rows = await this.groupRepo.findManyRaw({
      where: { status: 'active' as any },
      select: { id: true, code: true, type: true, name: true, status: true, context_id: true },
      orderBy: { id: 'asc' } as any,
    });
    return (rows as any[]).map((g) => ({
      id: String(g.id),
      code: g.code,
      type: g.type,
      name: g.name,
      status: g.status,
      contextId: String(g.context_id),
    }));
  }

  private async writeAllToRedis(rows: GroupCatalogItem[]): Promise<void> {
    const ids = rows.map((r) => r.id);
    const byId: Record<string, string> = {};
    const idsByCtx = new Map<string, string[]>();
    for (const r of rows) {
      byId[r.id] = JSON.stringify(r);
      const list = idsByCtx.get(r.contextId) ?? [];
      list.push(r.id);
      idsByCtx.set(r.contextId, list);
    }
    const idsByCtxHash: Record<string, string> = {};
    for (const [ctxId, groupIds] of idsByCtx) {
      idsByCtxHash[ctxId] = JSON.stringify(groupIds);
    }

    await this.redis.withPipeline((p) => {
      (p as any).del(RbacCatalogKeys.grpById);
      (p as any).del(RbacCatalogKeys.grpIds);
      (p as any).del(RbacCatalogKeys.grpIdsByContext);

      for (const [field, value] of Object.entries(byId)) {
        (p as any).hset(RbacCatalogKeys.grpById, field, value);
      }
      for (const [field, value] of Object.entries(idsByCtxHash)) {
        (p as any).hset(RbacCatalogKeys.grpIdsByContext, field, value);
      }

      (p as any).set(RbacCatalogKeys.grpIds, JSON.stringify(ids), 'EX', RBAC_CATALOG_TTL_SEC);
      (p as any).expire(RbacCatalogKeys.grpById, RBAC_CATALOG_TTL_SEC);
      (p as any).expire(RbacCatalogKeys.grpIdsByContext, RBAC_CATALOG_TTL_SEC);
    });
  }
}


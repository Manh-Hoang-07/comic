import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PERM } from '@/modules/core/rbac/rbac.constants';
import { RedisUtil } from '@/core/utils/redis.util';
import { PermissionCatalogService } from '@/modules/core/rbac/catalog/permission-catalog.service';

type PermissionNode = { code: string; parentCode: string | null };

@Injectable()
export class RbacPermissionIndexService implements OnModuleInit, OnModuleDestroy {
  private permissionByCode = new Map<string, PermissionNode>();
  private denseIndexByCode = new Map<string, number>();
  private denseCodes: string[] = [];
  private lastPermFetchMs = 0;
  private readonly permIndexTtlMs = 24 * 60 * 60 * 1000;
  // Safety net in case pub/sub is down; keep it infrequent.
  private readonly prewarmIntervalMs = 6 * 60 * 60 * 1000;
  private readonly permIndexRefreshChannel = 'rbac:perm_index_refresh';
  private permissionIndexRefreshInFlight: Promise<void> | null = null;
  private prewarmTimer: NodeJS.Timeout | null = null;

  constructor(
    private readonly permissionCatalog: PermissionCatalogService,
    private readonly redis: RedisUtil,
  ) { }

  async onModuleInit(): Promise<void> {
    await this.ensurePermissionIndexes().catch(() => undefined);

    if (this.redis.isEnabled()) {
      await this.redis.subscribe(this.permIndexRefreshChannel, (_message) => {
        void this.refreshNow().catch(() => undefined);
      });
    }

    this.prewarmTimer = setInterval(() => {
      void this.ensurePermissionIndexes().catch(() => undefined);
    }, this.prewarmIntervalMs);
  }

  onModuleDestroy(): void {
    if (this.prewarmTimer) {
      clearInterval(this.prewarmTimer);
      this.prewarmTimer = null;
    }
  }

  async preparePermissionCheck(): Promise<void> {
    await this.ensurePermissionIndexes();
  }

  async refreshNow(): Promise<void> {
    // Force refresh on next ensure call.
    this.lastPermFetchMs = 0;
    await this.ensurePermissionIndexes(true);
  }

  matchesAssigned(assignedCodes: Set<string>, need: string): boolean {
    return this.grants(need, (code) => assignedCodes.has(code));
  }

  matchesAssignedBitmap(bitmap: Uint8Array, need: string): boolean {
    return this.grants(need, (code) => this.hasCodeBit(bitmap, code));
  }

  hasAnyRequiredFromAssigned(assignedCodes: Set<string>, required: string[]): boolean {
    return required.some((need) => this.matchesAssigned(assignedCodes, need));
  }

  buildAssignedBitmap(assignedCodes: Iterable<string>): Uint8Array {
    const byteLen = Math.ceil(this.denseCodes.length / 8);
    const buf = new Uint8Array(byteLen);
    for (const code of assignedCodes) {
      const idx = this.denseIndexByCode.get(code);
      if (idx === undefined) continue;
      buf[idx >> 3] |= 1 << (idx & 7);
    }
    return buf;
  }

  hasAnyRequiredFromAssignedBitmap(bitmap: Uint8Array, required: string[]): boolean {
    return required.some((need) => this.matchesAssignedBitmap(bitmap, need));
  }

  private async ensurePermissionIndexes(force = false): Promise<void> {
    if (!force && this.permissionByCode.size > 0 && Date.now() - this.lastPermFetchMs <= this.permIndexTtlMs) return;

    if (this.permissionIndexRefreshInFlight) {
      await this.permissionIndexRefreshInFlight;
      return;
    }

    this.permissionIndexRefreshInFlight = (async () => {
      const byCode = new Map<string, PermissionNode>();
      const all = await this.permissionCatalog.getAllActivePermissions();
      for (const p of all as PermissionNode[]) {
        if (p.code) byCode.set(p.code, p);
      }
      this.permissionByCode = byCode;
      this.rebuildDenseIndex(byCode);
      this.lastPermFetchMs = Date.now();
    })();

    try {
      await this.permissionIndexRefreshInFlight;
    } finally {
      this.permissionIndexRefreshInFlight = null;
    }
  }

  private rebuildDenseIndex(byCode: Map<string, PermissionNode>): void {
    // Stable dense index to keep bitmaps compact.
    const codes = [...byCode.keys()].filter(Boolean).sort((a, b) => a.localeCompare(b));
    const idx = new Map<string, number>();
    for (let i = 0; i < codes.length; i++) idx.set(codes[i], i);
    this.denseCodes = codes;
    this.denseIndexByCode = idx;
  }

  private hasCodeBit(bitmap: Uint8Array, code: string): boolean {
    const idx = this.denseIndexByCode.get(code);
    if (idx === undefined) return false;
    const byte = bitmap[idx >> 3];
    return (byte & (1 << (idx & 7))) !== 0;
  }

  /** Single inheritance walk: `has(code)` is bitmap lookup or Set membership. */
  private grants(need: string, has: (code: string) => boolean): boolean {
    if (has(PERM.SYSTEM.MANAGE)) return true;
    if (has(need)) return true;
    for (let cur = this.permissionByCode.get(need); cur?.parentCode;) {
      const parent = this.permissionByCode.get(cur.parentCode);
      if (!parent) break;
      if (parent.code && has(parent.code)) return true;
      cur = parent;
    }
    return false;
  }
}

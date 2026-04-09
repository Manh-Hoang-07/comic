import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PERM } from '@/modules/core/rbac/rbac.constants';
import { IPermissionRepository, PERMISSION_REPOSITORY } from '@/modules/core/iam/permission/domain/permission.repository';
import { RedisUtil } from '@/core/utils/redis.util';

type PermissionNode = { id: any; code: string; parent_id: any | null };

@Injectable()
export class RbacPermissionIndexService implements OnModuleInit, OnModuleDestroy {
  private permissionById = new Map<string, PermissionNode>();
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
    @Inject(PERMISSION_REPOSITORY) private readonly permissionRepo: IPermissionRepository,
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
    // Backward-compatible API for legacy callers/tests.
    return this.grantsFromCodes(assignedCodes, need);
  }

  matchesAssignedBitmap(bitmap: Uint8Array, need: string): boolean {
    return this.grantsFromBitmap(bitmap, need);
  }

  hasAnyRequiredFromAssigned(assignedCodes: Set<string>, required: string[]): boolean {
    // Backward-compatible API for legacy callers/tests.
    return required.some((need) => this.grantsFromCodes(assignedCodes, need));
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
    return required.some((need) => this.grantsFromBitmap(bitmap, need));
  }

  private async ensurePermissionIndexes(force = false): Promise<void> {
    if (!force && this.permissionById.size > 0 && Date.now() - this.lastPermFetchMs <= this.permIndexTtlMs) return;

    if (this.permissionIndexRefreshInFlight) {
      await this.permissionIndexRefreshInFlight;
      return;
    }

    this.permissionIndexRefreshInFlight = (async () => {
      const all = await this.permissionRepo.findActiveForRbacIndex();
      const byId = new Map<string, PermissionNode>();
      const byCode = new Map<string, PermissionNode>();
      for (const p of all as PermissionNode[]) {
        byId.set(String(p.id), p);
        if (p.code) byCode.set(p.code, p);
      }
      this.permissionById = byId;
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

  private grantsFromBitmap(bitmap: Uint8Array, need: string): boolean {
    if (this.hasCodeBit(bitmap, PERM.SYSTEM.MANAGE)) return true;
    if (this.hasCodeBit(bitmap, need)) return true;

    for (let cur = this.permissionByCode.get(need); cur?.parent_id;) {
      const parent = this.permissionById.get(String(cur.parent_id));
      if (!parent) break;
      if (parent.code && this.hasCodeBit(bitmap, parent.code)) return true;
      cur = parent;
    }
    return false;
  }

  private grantsFromCodes(assignedCodes: Set<string>, need: string): boolean {
    if (assignedCodes.has(PERM.SYSTEM.MANAGE)) return true;
    if (assignedCodes.has(need)) return true;

    for (let cur = this.permissionByCode.get(need); cur?.parent_id;) {
      const parent = this.permissionById.get(String(cur.parent_id));
      if (!parent) break;
      if (parent.code && assignedCodes.has(parent.code)) return true;
      cur = parent;
    }
    return false;
  }
}

import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisUtil } from '@/core/utils/redis.util';

@Injectable()
export class RbacCacheService implements OnModuleInit {
  private readonly ttlSeconds: number;
  private readonly invalidationChannel = 'rbac:invalidation';
  private readonly permIndexRefreshChannel = 'rbac:perm_index_refresh';
  private readonly versionKey = 'rbac:meta';
  private readonly versionField = 'version';
  private version = 1;
  private versionLastFetch = 0;
  private readonly versionTtlMs = 30000;
  // L1 Cache (In-Memory)
  private l1Cache = new Map<string, { data: Uint8Array; expiry: number }>();
  private readonly l1TtlMs = 30000;
  private readonly blobPrefix = 'b64:v1:';

  constructor(
    private readonly redis: RedisUtil,
    private readonly configService: ConfigService,
  ) {
    this.ttlSeconds = Number(this.configService.get('RBAC_CACHE_TTL') || 3600);
  }

  async onModuleInit() {
    if (this.redis.isEnabled()) {
      await this.ensureVersion().catch(() => undefined);
      await this.redis.subscribe(this.invalidationChannel, (message) => {
        try {
          const { type, userId, key, version } = JSON.parse(message);
          if (type === 'user_all') this.clearL1ByUser(userId);
          else if (type === 'specific_key') this.l1Cache.delete(key);
          else if (type === 'clear_all') this.l1Cache.clear();
          if (typeof version === 'number' && Number.isFinite(version) && version > 0) {
            this.version = version;
            this.versionLastFetch = Date.now();
          }
        } catch (e) { }
      });
    }
  }

  private async ensureVersion(): Promise<number> {
    if (!this.redis.isEnabled()) return 1;
    if (Date.now() - this.versionLastFetch < this.versionTtlMs) return this.version;

    const meta = await this.redis.hgetall(this.versionKey);
    const parsed = Number(meta?.[this.versionField] || 1);
    this.version = Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
    this.versionLastFetch = Date.now();
    return this.version;
  }

  private async buildCacheKey(userId: any, groupId: any | null): Promise<string> {
    const v = await this.ensureVersion();
    return groupId === null ? `rbac:v${v}:u:${userId}:g:system` : `rbac:v${v}:u:${userId}:g:${groupId}`;
  }

  private clearL1ByUser(userId: any) {
    const needle = `:u:${userId}:`;
    for (const k of this.l1Cache.keys()) if (k.includes(needle)) this.l1Cache.delete(k);
  }

  /**
   * Backward-compatible API for unit tests / older callers.
   * Prefer using `RbacService` for permission checks.
   */
  async hasPermission(userId: any, groupId: any | null, permission: string): Promise<boolean> {
    const read = await this.getPermissions(userId, groupId);
    if (!read.cached) return false;
    return this.hasCodeBit(read.bitmap, permission);
  }

  /**
   * Đọc AssignedPermissionsBitmap từ cache theo single-read.
   *
   * - `cached=true`: key tồn tại (kể cả empty bitmap)
   * - `cached=false`: key chưa tồn tại, caller có thể refresh từ DB
   */
  async getPermissions(
    userId: any,
    groupId: any | null,
  ): Promise<{ bitmap: Uint8Array; cached: boolean }> {
    const key = await this.buildCacheKey(userId, groupId);

    const l1 = this.l1Cache.get(key);
    if (l1 && l1.expiry > Date.now()) {
      return { bitmap: l1.data, cached: true };
    }

    if (!this.redis.isEnabled()) {
      return { bitmap: new Uint8Array(), cached: false };
    }

    const raw = await this.redis.get(key);
    if (raw) {
      const data = this.decodeBlob(raw);
      this.l1Cache.set(key, { data, expiry: Date.now() + this.l1TtlMs });
      return { bitmap: data, cached: true };
    }

    return { bitmap: new Uint8Array(), cached: false };
  }

  async setPermissions(userId: any, groupId: any | null, bitmap: Uint8Array) {
    const key = await this.buildCacheKey(userId, groupId);

    this.l1Cache.delete(key);

    if (!this.redis.isEnabled()) {
      return;
    }

    const value = this.encodeBlob(bitmap);
    await this.redis.set(key, value, this.ttlSeconds);
    await this.redis.trackKey(Number(userId), key);

    await this.redis.publish(this.invalidationChannel, JSON.stringify({ type: 'specific_key', key, version: this.version }));
  }

  async clearUserCache(userId: any, groupId: any | null) {
    const key = await this.buildCacheKey(userId, groupId);
    await this.redis.del(key);
    this.l1Cache.delete(key);
  }

  async clearAllUserCaches(userId: any) {
    if (!this.redis.isEnabled()) return;
    const keys = await this.redis.getTrackedKeys(Number(userId));
    for (const k of keys) {
      await this.redis.del(k);
    }
    await this.redis.clearTrackedKeys(Number(userId));
    this.clearL1ByUser(userId);
    await this.redis.publish(this.invalidationChannel, JSON.stringify({ type: 'user_all', userId }));
  }

  async isCached(userId: any, groupId: any | null): Promise<boolean> {
    const key = await this.buildCacheKey(userId, groupId);
    const l1 = this.l1Cache.get(key);
    if (l1 && l1.expiry > Date.now()) return true;
    if (!this.redis.isEnabled()) return false;
    return await this.redis.exists(key);
  }

  /**
   * Invalidate all RBAC caches across the cluster.
   * Call this when global permissions or roles are changed.
   */
  async bumpVersion(): Promise<void> {
    this.l1Cache.clear();
    if (this.redis.isEnabled()) {
      const next = await this.redis.hincrby(this.versionKey, this.versionField, 1);
      this.version = Number(next) > 0 ? Number(next) : (this.version + 1);
      this.versionLastFetch = Date.now();
      await this.redis.publish(this.invalidationChannel, JSON.stringify({ type: 'clear_all', version: this.version }));
      // PermissionIndex should refresh across instances on global RBAC changes.
      await this.redis.publish(this.permIndexRefreshChannel, JSON.stringify({ type: 'perm_index_refresh', version: this.version }));
    }
  }

  private encodeBlob(bitmap: Uint8Array): string {
    if (!bitmap || bitmap.length === 0) return this.blobPrefix;
    const b64 = Buffer.from(bitmap).toString('base64');
    return `${this.blobPrefix}${b64}`;
  }

  private decodeBlob(raw: string): Uint8Array {
    if (!raw) return new Uint8Array();
    if (!raw.startsWith(this.blobPrefix)) {
      // Backward-compat: unknown format => treat as empty.
      return new Uint8Array();
    }
    const b64 = raw.slice(this.blobPrefix.length);
    if (!b64) return new Uint8Array();
    try {
      return new Uint8Array(Buffer.from(b64, 'base64'));
    } catch {
      return new Uint8Array();
    }
  }

  // Legacy helper: exact bit check for `hasPermission`.
  // Note: this is NOT used by RbacService's inheritance logic.
  private hasCodeBit(_bitmap: Uint8Array, _code: string): boolean {
    // Without DenseIndex we can't map code->bit here.
    // Keep legacy API conservative.
    return false;
  }
}



import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisUtil } from '@/core/utils/redis.util';

@Injectable()
export class RbacCacheService implements OnModuleInit {
  private readonly ttlSeconds: number;
  private readonly invalidationChannel = 'rbac:invalidation';
  private readonly emptyPermissionSentinel = '__rbac_empty__';
  private readonly versionKey = 'rbac:meta';
  private readonly versionField = 'version';
  private version = 1;
  private versionLastFetch = 0;
  private readonly versionTtlMs = 30000;
  // L1 Cache (In-Memory)
  private l1Cache = new Map<string, { data: Set<string>; expiry: number }>();
  private readonly l1TtlMs = 30000;

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
    return groupId === null ? `rbac:v${v}:u:${userId}:system` : `rbac:v${v}:u:${userId}:g:${groupId}`;
  }

  private clearL1ByUser(userId: any) {
    const needle = `:u:${userId}:`;
    for (const k of this.l1Cache.keys()) if (k.includes(needle)) this.l1Cache.delete(k);
  }

  /**
   * Backward-compatible API for unit tests / older callers.
   * Checks L1 first; on L2 hit, warms L1 via `smembers` (single fetch for later checks).
   */
  async hasPermission(userId: any, groupId: any | null, permission: string): Promise<boolean> {
    const key = await this.buildCacheKey(userId, groupId);

    const l1 = this.l1Cache.get(key);
    if (l1 && l1.expiry > Date.now()) return l1.data.has(permission);

    if (!this.redis.isEnabled()) return false;

    const isMember = await this.redis.sismember(key, permission);
    if (!isMember) return false;

    const permissions = await this.redis.smembers(key);
    const data = new Set(permissions.filter((p) => p !== this.emptyPermissionSentinel));
    this.l1Cache.set(key, { data, expiry: Date.now() + this.l1TtlMs });
    return data.has(permission);
  }

  /**
   * Đọc permissions từ cache theo single-read.
   *
   * - `cached=true`: key tồn tại (kể cả empty sentinel)
   * - `cached=false`: key chưa tồn tại, caller có thể refresh từ DB
   */
  async getPermissions(
    userId: any,
    groupId: any | null,
  ): Promise<{ permissions: Set<string>; cached: boolean }> {
    const key = await this.buildCacheKey(userId, groupId);

    const l1 = this.l1Cache.get(key);
    if (l1 && l1.expiry > Date.now()) {
      return { permissions: l1.data, cached: true };
    }

    if (!this.redis.isEnabled()) {
      return { permissions: new Set(), cached: false };
    }

    const permissions = await this.redis.smembers(key);
    if (permissions.length > 0) {
      const data = new Set(permissions.filter((p) => p !== this.emptyPermissionSentinel));
      this.l1Cache.set(key, { data, expiry: Date.now() + this.l1TtlMs });
      return { permissions: data, cached: true };
    }

    return { permissions: new Set(), cached: false };
  }

  async setPermissions(userId: any, groupId: any | null, permissions: string[]) {
    const key = await this.buildCacheKey(userId, groupId);

    // Backward-compat with existing tests: after set we clear L1,
    // so next read reflects L2 and follows invalidation flow.
    this.l1Cache.delete(key);

    if (!this.redis.isEnabled()) {
      return;
    }

    await this.redis.del(key);
    if (permissions.length > 0) {
      await this.redis.sadd(key, ...permissions);
    } else {
      // Persist empty permission sets to avoid repeated DB refresh on every request.
      await this.redis.sadd(key, this.emptyPermissionSentinel);
    }
    await this.redis.expire(key, this.ttlSeconds);
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
    }
  }
}



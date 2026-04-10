import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisUtil } from '@/core/utils/redis.util';
import {
  decodeAssignedBitmapBlob,
  encodeAssignedBitmapBlob,
} from '@/modules/core/rbac/services/rbac-assigned-bitmap-blob.codec';
import { RbacBitmapL1Cache } from '@/modules/core/rbac/services/rbac-bitmap-l1-cache';

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
  private readonly l1 = new RbacBitmapL1Cache(30000);

  constructor(
    private readonly redis: RedisUtil,
    private readonly configService: ConfigService,
  ) {
    this.ttlSeconds = Number(this.configService.get('RBAC_CACHE_TTL') || 86400);
  }

  async onModuleInit() {
    if (this.redis.isEnabled()) {
      await this.ensureVersion().catch(() => undefined);
      await this.redis.subscribe(this.invalidationChannel, (message) => {
        try {
          const { type, userId, key, version } = JSON.parse(message);
          if (type === 'user_all') this.l1.deleteByUserId(userId);
          else if (type === 'specific_key') this.l1.delete(key);
          else if (type === 'clear_all') this.l1.clear();
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

  /**
   * Legacy: không có DenseIndex trong cache layer — luôn false. Dùng RbacService để check đầy đủ.
   */
  async hasPermission(userId: any, groupId: any | null, _permission: string): Promise<boolean> {
    await this.getPermissions(userId, groupId);
    return false;
  }

  /**
   * `cached=true`: key tồn tại (kể cả empty bitmap). `cached=false`: miss, caller refresh từ DB.
   */
  async getPermissions(
    userId: any,
    groupId: any | null,
  ): Promise<{ bitmap: Uint8Array; cached: boolean }> {
    const key = await this.buildCacheKey(userId, groupId);

    const l1Hit = this.l1.getValid(key);
    if (l1Hit !== undefined) {
      return { bitmap: l1Hit, cached: true };
    }

    if (!this.redis.isEnabled()) {
      return { bitmap: new Uint8Array(), cached: false };
    }

    const raw = await this.redis.get(key);
    if (raw) {
      const data = decodeAssignedBitmapBlob(raw);
      this.l1.set(key, data);
      return { bitmap: data, cached: true };
    }

    return { bitmap: new Uint8Array(), cached: false };
  }

  async setPermissions(userId: any, groupId: any | null, bitmap: Uint8Array) {
    const key = await this.buildCacheKey(userId, groupId);

    this.l1.delete(key);

    if (!this.redis.isEnabled()) {
      return;
    }

    const value = encodeAssignedBitmapBlob(bitmap);
    await this.redis.set(key, value, this.ttlSeconds);
    await this.redis.trackKey(Number(userId), key);

    await this.redis.publish(this.invalidationChannel, JSON.stringify({ type: 'specific_key', key, version: this.version }));
  }

  async clearUserCache(userId: any, groupId: any | null) {
    const key = await this.buildCacheKey(userId, groupId);
    await this.redis.del(key);
    this.l1.delete(key);
  }

  async clearAllUserCaches(userId: any) {
    if (!this.redis.isEnabled()) return;
    const keys = await this.redis.getTrackedKeys(Number(userId));
    for (const k of keys) {
      await this.redis.del(k);
    }
    await this.redis.clearTrackedKeys(Number(userId));
    this.l1.deleteByUserId(userId);
    await this.redis.publish(this.invalidationChannel, JSON.stringify({ type: 'user_all', userId }));
  }

  async isCached(userId: any, groupId: any | null): Promise<boolean> {
    const key = await this.buildCacheKey(userId, groupId);
    if (this.l1.hasValid(key)) return true;
    if (!this.redis.isEnabled()) return false;
    return await this.redis.exists(key);
  }

  async bumpVersion(): Promise<void> {
    this.l1.clear();
    if (this.redis.isEnabled()) {
      const next = await this.redis.hincrby(this.versionKey, this.versionField, 1);
      this.version = Number(next) > 0 ? Number(next) : (this.version + 1);
      this.versionLastFetch = Date.now();
      await this.redis.publish(this.invalidationChannel, JSON.stringify({ type: 'clear_all', version: this.version }));
      await this.redis.publish(this.permIndexRefreshChannel, JSON.stringify({ type: 'perm_index_refresh', version: this.version }));
    }
  }
}

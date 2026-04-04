import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisUtil } from '@/core/utils/redis.util';

@Injectable()
export class RbacCacheService implements OnModuleInit {
  private readonly ttlSeconds: number;
  private readonly invalidationChannel = 'rbac:invalidation';
  // L1 Cache (In-Memory) - TTL 30s
  private l1Cache = new Map<string, { data: Set<string>; expiry: number }>();
  private readonly l1TtlMs = 30000;

  constructor(
    private readonly redis: RedisUtil,
    private readonly configService: ConfigService,
  ) {
    this.ttlSeconds = Number(this.configService.get('RBAC_CACHE_TTL') || 3600);
  }

  async onModuleInit() {
    // Lắng nghe lệnh xoá cache từ các server khác
    if (this.redis.isEnabled()) {
      await this.redis.subscribe(this.invalidationChannel, (message) => {
        try {
          const { type, userId, key } = JSON.parse(message);
          if (type === 'user_all') {
            this.clearL1ByUser(userId);
          } else if (type === 'specific_key') {
            this.l1Cache.delete(key);
          } else if (type === 'clear_all') {
            this.l1Cache.clear();
          }
        } catch (e) { }
      });
    }
  }

  private clearL1ByUser(userId: any) {
    const prefix = `rbac:u:${userId}:`;
    for (const cacheKey of this.l1Cache.keys()) {
      if (cacheKey.startsWith(prefix)) {
        this.l1Cache.delete(cacheKey);
      }
    }
  }

  private getGroupKey(userId: any, groupId: any): string {
    return `rbac:u:${userId}:g:${groupId}`;
  }

  private getSystemKey(userId: any): string {
    return `rbac:u:${userId}:system`;
  }

  async hasPermission(userId: any, groupId: any | null, permission: string): Promise<boolean> {
    const perms = await this.getPermissions(userId, groupId);
    return perms.has(permission);
  }

  /**
   * Get all permissions for a user in a specific group.
   * Utilizes L1 (memory) and L2 (Redis) caches.
   */
  async getPermissions(userId: any, groupId: any | null): Promise<Set<string>> {
    const key = groupId === null ? this.getSystemKey(userId) : this.getGroupKey(userId, groupId);

    const l1 = this.l1Cache.get(key);
    if (l1 && l1.expiry > Date.now()) return l1.data;

    if (!this.redis.isEnabled()) {
      return new Set();
    }

    const permissions = await this.redis.smembers(key);
    if (permissions.length > 0) {
      const data = new Set(permissions);
      this.l1Cache.set(key, { data, expiry: Date.now() + this.l1TtlMs });
      return data;
    }

    return new Set();
  }

  private async loadToL1(userId: any, groupId: any | null) {
    const key = groupId === null ? this.getSystemKey(userId) : this.getGroupKey(userId, groupId);
    const permissions = await this.redis.smembers(key);
    if (permissions.length) this.l1Cache.set(key, { data: new Set(permissions), expiry: Date.now() + this.l1TtlMs });
  }

  async setPermissions(userId: any, groupId: any | null, permissions: string[]) {
    const key = groupId === null ? this.getSystemKey(userId) : this.getGroupKey(userId, groupId);
    const data = new Set(permissions);
    const l1Expiry = Date.now() + (this.redis.isEnabled() ? this.l1TtlMs : this.ttlSeconds * 1000);
    this.l1Cache.set(key, { data, expiry: l1Expiry });

    if (!this.redis.isEnabled()) {
      return;
    }

    const trackKeysSet = `rbac:u:${userId}:keys`;
    await this.redis.withPipeline((p) => {
      p.del(key);
      if (permissions.length > 0) {
        p.sadd(key, ...permissions);
        p.expire(key, this.ttlSeconds);
        p.sadd(trackKeysSet, key);
      }
    });
    this.l1Cache.delete(key);
    await this.redis.publish(this.invalidationChannel, JSON.stringify({ type: 'specific_key', key }));
  }

  async clearUserCache(userId: any, groupId: any | null) {
    const key = groupId === null ? this.getSystemKey(userId) : this.getGroupKey(userId, groupId);
    await this.redis.del(key);
    this.l1Cache.delete(key);
  }

  async clearAllUserCaches(userId: any) {
    if (!this.redis.isEnabled()) return;
    const keys = await this.redis.getTrackedKeys(userId);
    const trackKey = `rbac:u:${userId}:keys`;
    const toUnlink = keys.length ? [...keys, trackKey] : [trackKey];
    await this.redis.unlinkMany(toUnlink);
    this.clearL1ByUser(userId);
    await this.redis.publish(this.invalidationChannel, JSON.stringify({ type: 'user_all', userId }));
  }

  async isCached(userId: any, groupId: any | null): Promise<boolean> {
    const key = groupId === null ? this.getSystemKey(userId) : this.getGroupKey(userId, groupId);
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
      const keys = await this.redis.scan('rbac:*');
      const batch = 500;
      for (let i = 0; i < keys.length; i += batch) {
        await this.redis.unlinkMany(keys.slice(i, i + batch));
      }
      await this.redis.publish(this.invalidationChannel, JSON.stringify({ type: 'clear_all' }));
    }
  }
}



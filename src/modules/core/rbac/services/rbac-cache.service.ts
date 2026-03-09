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
          }
        } catch (e) { }
      });
    }
  }

  private clearL1ByUser(userId: number) {
    const prefix = `rbac:u:${userId}:`;
    for (const cacheKey of this.l1Cache.keys()) {
      if (cacheKey.startsWith(prefix)) {
        this.l1Cache.delete(cacheKey);
      }
    }
  }

  private getGroupKey(userId: number, groupId: number): string {
    return `rbac:u:${userId}:g:${groupId}`;
  }

  private getSystemKey(userId: number): string {
    return `rbac:u:${userId}:system`;
  }

  async hasPermission(userId: number, groupId: number | null, permission: string): Promise<boolean> {
    if (!this.redis.isEnabled()) return false;
    const key = groupId === null ? this.getSystemKey(userId) : this.getGroupKey(userId, groupId);
    const l1 = this.l1Cache.get(key);
    if (l1 && l1.expiry > Date.now()) return l1.data.has(permission);
    if (await this.redis.sismember(key, permission)) {
      await this.loadToL1(userId, groupId);
      return true;
    }
    return false;
  }

  private async loadToL1(userId: number, groupId: number | null) {
    const key = groupId === null ? this.getSystemKey(userId) : this.getGroupKey(userId, groupId);
    const permissions = await this.redis.smembers(key);
    if (permissions.length) this.l1Cache.set(key, { data: new Set(permissions), expiry: Date.now() + this.l1TtlMs });
  }

  async setPermissions(userId: number, groupId: number | null, permissions: string[]) {
    if (!this.redis.isEnabled()) return;
    const key = groupId === null ? this.getSystemKey(userId) : this.getGroupKey(userId, groupId);
    await this.redis.del(key);
    if (permissions.length) {
      await this.redis.sadd(key, ...permissions);
      await (this.redis as any).client?.expire(key, this.ttlSeconds);
      await this.redis.trackKey(userId, key);
    }
    this.l1Cache.delete(key);
    await this.redis.publish(this.invalidationChannel, JSON.stringify({ type: 'specific_key', key }));
  }

  async clearUserCache(userId: number, groupId: number | null) {
    const key = groupId === null ? this.getSystemKey(userId) : this.getGroupKey(userId, groupId);
    await this.redis.del(key);
    this.l1Cache.delete(key);
  }

  async clearAllUserCaches(userId: number) {
    if (!this.redis.isEnabled()) return;
    const keys = await this.redis.getTrackedKeys(userId);
    for (const key of keys) await this.redis.del(key);
    await this.redis.clearTrackedKeys(userId);
    this.clearL1ByUser(userId);
    await this.redis.publish(this.invalidationChannel, JSON.stringify({ type: 'user_all', userId }));
  }

  async isCached(userId: number, groupId: number | null): Promise<boolean> {
    if (!this.redis.isEnabled()) return false;
    const key = groupId === null ? this.getSystemKey(userId) : this.getGroupKey(userId, groupId);
    return this.l1Cache.has(key) || (await (this.redis as any).client?.exists(key)) === 1;
  }
}

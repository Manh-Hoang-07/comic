import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import type { Cache } from 'cache-manager';
import { RedisUtil } from '@/core/utils/redis.util';
import { serializeForCache, deserializeFromCache, isCacheMiss } from '../cache-serializer';

@Injectable()
export class CacheService {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly redis: RedisUtil,
    private readonly configService: ConfigService,
  ) { }

  // ── Driver selection ──────────────────────────────────────────────────────

  private useRedis(): boolean {
    const driver =
      this.configService.get<string>('CACHE_DRIVER') ||
      process.env.CACHE_DRIVER ||
      'memory';
    return driver === 'redis' && this.redis?.isEnabled();
  }

  // ── Core operations ───────────────────────────────────────────────────────

  /** Lấy giá trị từ cache. */
  async get<T>(key: string): Promise<T | undefined> {
    if (this.useRedis()) {
      try {
        const raw = await this.redis.get(key);
        if (raw === null || raw === 'null') return undefined;
        return deserializeFromCache<T>(raw);
      } catch {
        // Redis unavailable → fall through to in-memory
      }
    }
    return this.cacheManager.get<T>(key);
  }

  /** Lưu giá trị vào cache (Redis + in-memory). */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    if (this.useRedis()) {
      try {
        const serialized = serializeForCache(value);
        if (serialized) {
          await this.redis.set(key, serialized, ttl);
        }
      } catch {
        // Silent: continue to set in-memory fallback
      }
    }

    try {
      const ttlMs = ttl ? ttl * 1000 : undefined;
      await this.cacheManager.set(key, value, ttlMs);
    } catch {
      // Silent
    }
  }

  /** Xóa một key khỏi cache (Redis + in-memory). */
  async del(key: string): Promise<void> {
    try {
      if (this.redis?.isEnabled()) await this.redis.del(key);
      if (this.cacheManager) await this.cacheManager.del(key);
    } catch {
      // Silent
    }
  }

  /** Xóa tất cả cache in-memory. */
  async reset(): Promise<void> {
    await this.cacheManager.clear();
  }

  /** Xóa các key Redis khớp với pattern (glob). */
  async deletePattern(pattern: string): Promise<void> {
    if (!this.redis?.isEnabled()) return;
    const keys = await this.redis.keys(pattern);
    await Promise.all(keys.map((k) => this.redis.del(k)));
  }

  // ── Higher-level helpers ──────────────────────────────────────────────────

  /**
   * Lấy từ cache; nếu miss thì gọi callback, lưu kết quả và trả về.
   * Empty string và empty plain object `{}` được coi là cache miss.
   */
  async getOrSet<T>(
    key: string,
    callback: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (!isCacheMiss(cached)) return cached as T;

    const value = await callback();
    await this.set(key, value, ttl);
    return value;
  }
}

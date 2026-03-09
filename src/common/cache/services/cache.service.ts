import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import type { Cache } from 'cache-manager';
import { RedisUtil } from '@/core/utils/redis.util';

@Injectable()
export class CacheService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly redis: RedisUtil,
    private readonly configService: ConfigService,
  ) { }


  /**
   * Kiểm tra driver đang sử dụng
   */
  private useRedis(): boolean {
    const driver = this.configService.get<string>('CACHE_DRIVER') || process.env.CACHE_DRIVER || 'memory';
    return driver === 'redis' && this.redis?.isEnabled();
  }

  /**
   * Lấy giá trị từ cache
   */
  async get<T>(key: string): Promise<T | undefined> {
    if (this.useRedis()) {
      try {
        const val = await this.redis.get(key);
        if (val === null || val === 'null') return undefined;
        try {
          return JSON.parse(val) as T;
        } catch (e) {
          return val as any;
        }
      } catch (e) {
        // Fallback to memory
      }
    }
    return await this.cacheManager.get<T>(key);
  }

  /**
   * Lưu giá trị vào cache
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const isRedis = this.useRedis();

    if (isRedis) {
      try {
        const cache = new Set();
        const val = typeof value === 'string'
          ? value
          : JSON.stringify(value, (k, v) => {
            if (typeof v === 'bigint') return v.toString();
            if (typeof v === 'object' && v !== null) {
              if (cache.has(v)) return '[Circular]';
              cache.add(v);
            }
            return v;
          });

        if (val) {
          await this.redis.set(key, val, ttl);
        }
      } catch (e) {
        // Silent error
      }
    }

    const ttlMs = ttl ? ttl * 1000 : undefined;
    try {
      await this.cacheManager.set(key, value, ttlMs);
    } catch (e) {
      // Silent error
    }
  }



  /**
   * Xóa giá trị khỏi cache
   */
  async del(key: string): Promise<void> {
    try {
      // Xóa trong Redis
      if (this.redis?.isEnabled()) {
        await this.redis.del(key);
      }

      // Xóa trong cache manager
      if (this.cacheManager) {
        await this.cacheManager.del(key);
      }
    } catch (error) {
      // Silent error
    }
  }

  /**
   * Xóa tất cả cache
   */
  async reset(): Promise<void> {
    if (this.useRedis()) {
      // Cẩn thận: flushall có thể xóa sạch data khác trong Redis nếu dùng chung
      // Ở đây ta chỉ nên clear các key theo pattern của app nếu cần
    }
    await this.cacheManager.clear();
  }

  /**
   * Lấy hoặc set cache với callback
   */
  async getOrSet<T>(
    key: string,
    callback: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    const cached = await this.get<T>(key);

    // Chỉ dùng cache nếu:
    // - khác undefined
    // - KHÔNG phải string rỗng
    // - KHÔNG phải object rỗng ({}), vẫn cho phép [] hoặc các kiểu khác
    const isEmptyString =
      typeof cached === 'string' && cached.trim().length === 0;

    const isEmptyPlainObject =
      cached !== null &&
      typeof cached === 'object' &&
      cached.constructor === Object &&
      Object.keys(cached).length === 0;

    if (cached !== undefined && !isEmptyString && !isEmptyPlainObject) {
      return cached;
    }

    const value = await callback();
    await this.set(key, value, ttl);
    return value;
  }


  /**
   * Xóa cache theo pattern (prefix)
   */
  async deletePattern(pattern: string): Promise<void> {
    if (this.redis?.isEnabled()) {
      const keys = await this.redis.keys(pattern);
      await Promise.all(keys.map(key => this.redis.del(key)));
    }
  }
}


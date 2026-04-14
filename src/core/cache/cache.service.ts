import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChainableCommander } from 'ioredis';
import { ICacheStrategy } from './interfaces/cache-strategy.interface';
import { RedisCacheStrategy } from './strategies/redis-cache.strategy';
import { MemoryCacheStrategy } from './strategies/memory-cache.strategy';

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private strategy: ICacheStrategy;

  constructor(private readonly configService: ConfigService) {
    const driver = this.configService.get<string>('CACHE_DRIVER') || 'redis';

    if (driver === 'memory') {
      this.strategy = new MemoryCacheStrategy();
    } else {
      this.strategy = new RedisCacheStrategy(this.configService);
    }
  }

  async onModuleInit(): Promise<void> {
    await this.strategy.onModuleInit();
  }

  async onModuleDestroy(): Promise<void> {
    await this.strategy.onModuleDestroy();
  }

  isEnabled(): boolean {
    return this.strategy.isEnabled();
  }

  // --- Proxy methods ---
  async get(key: string): Promise<string | null> {
    return this.strategy.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    await this.strategy.set(key, value, ttlSeconds);
  }

  async del(key: string): Promise<void> {
    await this.strategy.del(key);
  }

  async exists(key: string): Promise<boolean> {
    return this.strategy.exists(key);
  }

  async mget(...keys: string[]): Promise<(string | null)[]> {
    return this.strategy.mget(...keys);
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    await this.strategy.expire(key, ttlSeconds);
  }

  async flushDb(): Promise<void> {
    await this.strategy.flushDb();
  }

  async unlinkMany(keys: string[]): Promise<void> {
    await this.strategy.unlinkMany(keys);
  }

  async rename(oldKey: string, newKey: string): Promise<void> {
    await this.strategy.rename(oldKey, newKey);
  }

  async keys(pattern: string): Promise<string[]> {
    return this.strategy.keys(pattern);
  }

  async scan(pattern: string, count?: number): Promise<string[]> {
    return this.strategy.scan(pattern, count);
  }

  async hset(key: string, field: string, value: string): Promise<void> {
    await this.strategy.hset(key, field, value);
  }

  async hget(key: string, field: string): Promise<string | null> {
    return this.strategy.hget(key, field);
  }

  async hdel(key: string, ...fields: string[]): Promise<void> {
    await this.strategy.hdel(key, ...fields);
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    return this.strategy.hgetall(key);
  }

  async hincrby(
    key: string,
    field: string,
    increment: number,
  ): Promise<number> {
    return this.strategy.hincrby(key, field, increment);
  }

  async sadd(key: string, ...values: string[]): Promise<void> {
    await this.strategy.sadd(key, ...values);
  }

  async smembers(key: string): Promise<string[]> {
    return this.strategy.smembers(key);
  }

  async sismember(key: string, value: string): Promise<boolean> {
    return this.strategy.sismember(key, value);
  }

  async srem(key: string, ...values: string[]): Promise<void> {
    await this.strategy.srem(key, ...values);
  }

  async publish(channel: string, message: string): Promise<void> {
    await this.strategy.publish(channel, message);
  }

  async subscribe(
    channel: string,
    callback: (message: string) => void,
  ): Promise<void> {
    await this.strategy.subscribe(channel, callback);
  }

  async lock(
    key: string,
    ttlSeconds: number,
    token?: string,
  ): Promise<boolean> {
    return this.strategy.lock(key, ttlSeconds, token);
  }

  async unlock(key: string, token?: string): Promise<void> {
    await this.strategy.unlock(key, token);
  }

  async withPipeline(
    handler: (pipe: ChainableCommander) => void,
  ): Promise<void> {
    await this.strategy.withPipeline(handler);
  }

  // Tracking keys (Legacy helper from RedisUtil)
  async trackKey(userId: number, key: string): Promise<void> {
    await this.sadd(`rbac:u:${userId}:keys`, key);
  }

  async getTrackedKeys(userId: number): Promise<string[]> {
    return this.smembers(`rbac:u:${userId}:keys`);
  }

  async clearTrackedKeys(userId: number): Promise<void> {
    await this.del(`rbac:u:${userId}:keys`);
  }
}

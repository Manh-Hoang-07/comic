import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis, { Redis as RedisClient, ChainableCommander } from 'ioredis';
import { ICacheStrategy } from '../interfaces/cache-strategy.interface';

let globalRedisClient: RedisClient | null = null;

@Injectable()
export class RedisCacheStrategy implements ICacheStrategy {
  private client: RedisClient | null = null;
  private readonly url: string | undefined;

  constructor(private readonly configService: ConfigService) {
    this.url = this.configService.get<string>('REDIS_URL');

    if (this.url) {
      if (!globalRedisClient) {
        const options = {
          lazyConnect: true,
          maxRetriesPerRequest: 1,
          enableReadyCheck: false,
          retryStrategy: () => null,
          ...(this.url.startsWith('rediss://')
            ? { tls: { rejectUnauthorized: false } }
            : {}),
        };
        globalRedisClient = new Redis(this.url, options);
        globalRedisClient.on('error', () => {});
      }
      this.client = globalRedisClient;
    }
  }

  isEnabled(): boolean {
    return !!this.client;
  }

  async onModuleInit(): Promise<void> {
    if (!this.client) return;
    try {
      // In serverless, it might already be connected
      if (this.client.status === 'wait') {
        await this.client.connect();
      }
    } catch {
      // Redis is optional
    }
  }

  async onModuleDestroy(): Promise<void> {
    // We don't quit the global client in serverless to keep it warm for next invocation
    // only set local reference to null
    this.client = null;
  }

  async get(key: string): Promise<string | null> {
    return this.client?.get(key) || null;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.client) return;
    if (ttlSeconds && ttlSeconds > 0) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.client?.del(key);
  }

  async exists(key: string): Promise<boolean> {
    return (await this.client?.exists(key)) === 1;
  }

  async mget(...keys: string[]): Promise<(string | null)[]> {
    if (!this.client || keys.length === 0) return keys.map(() => null);
    const out = await this.client.mget(...keys);
    return out.map((v) => (v == null ? null : v));
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    if (!this.client || ttlSeconds <= 0) return;
    await this.client.expire(key, ttlSeconds);
  }

  async flushDb(): Promise<void> {
    await this.client?.flushdb();
  }

  async unlinkMany(keys: string[]): Promise<void> {
    if (!this.client || keys.length === 0) return;
    const pipeline = this.client.pipeline();
    for (const k of keys) pipeline.unlink(k);
    await pipeline.exec();
  }

  async rename(oldKey: string, newKey: string): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.rename(oldKey, newKey);
    } catch (e: any) {
      if (e.message !== 'ERR no such key') throw e;
    }
  }

  async keys(pattern: string): Promise<string[]> {
    return (await this.client?.keys(pattern)) || [];
  }

  async scan(pattern: string, count = 100): Promise<string[]> {
    if (!this.client) return [];
    const keys: string[] = [];
    let cursor = '0';
    do {
      const [nextCursor, foundKeys] = await this.client.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        count,
      );
      keys.push(...foundKeys);
      cursor = nextCursor;
    } while (cursor !== '0');
    return keys;
  }

  async hset(key: string, field: string, value: string): Promise<void> {
    await this.client?.hset(key, field, value);
  }

  async hget(key: string, field: string): Promise<string | null> {
    return (await this.client?.hget(key, field)) || null;
  }

  async hdel(key: string, ...fields: string[]): Promise<void> {
    await this.client?.hdel(key, ...fields);
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    return (await this.client?.hgetall(key)) || {};
  }

  async hincrby(
    key: string,
    field: string,
    increment: number,
  ): Promise<number> {
    return (await this.client?.hincrby(key, field, increment)) || 0;
  }

  async sadd(key: string, ...values: string[]): Promise<void> {
    await this.client?.sadd(key, ...values);
  }

  async smembers(key: string): Promise<string[]> {
    return (await this.client?.smembers(key)) || [];
  }

  async sismember(key: string, value: string): Promise<boolean> {
    return (await this.client?.sismember(key, value)) === 1;
  }

  async srem(key: string, ...values: string[]): Promise<void> {
    await this.client?.srem(key, ...values);
  }

  async publish(channel: string, message: string): Promise<void> {
    await this.client?.publish(channel, message);
  }

  async subscribe(
    _channel: string,
    _callback: (message: string) => void,
  ): Promise<void> {
    // subClient removed to optimize connection usage in serverless.
    // Pub/Sub listening is not supported in this strategy for now.
  }

  async lock(
    key: string,
    ttlSeconds: number,
    token = 'locked',
  ): Promise<boolean> {
    if (!this.client) return false;
    const result = await this.client.set(key, token, 'EX', ttlSeconds, 'NX');
    return result === 'OK';
  }

  async unlock(key: string, token = 'locked'): Promise<void> {
    if (!this.client) return;
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
    await this.client.eval(script, 1, key, token);
  }

  async withPipeline(
    handler: (pipe: ChainableCommander) => void,
  ): Promise<void> {
    if (!this.client) return;
    const p = this.client.pipeline();
    handler(p);
    await p.exec();
  }
}

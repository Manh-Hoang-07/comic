import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis, { Redis as RedisClient, ChainableCommander } from 'ioredis';

@Injectable()
export class RedisUtil implements OnModuleInit, OnModuleDestroy {
  private client: RedisClient | null = null;
  private readonly url: string | undefined;

  private subClient: RedisClient | null = null;

  constructor(private readonly configService: ConfigService) {
    this.url = process.env.REDIS_URL || this.configService.get<string>('REDIS_URL');
    if (this.url) {
      const options = {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        retryStrategy: () => null,
      };
      this.client = new Redis(this.url, options);
      this.subClient = new Redis(this.url, options);

      this.client.on('error', () => { });
      this.subClient.on('error', () => { });
    }
  }

  /** Kết nối sớm tránh hàng trăm request đồng thời cùng lazyConnect một lúc. */
  async onModuleInit(): Promise<void> {
    if (!this.client) return;
    try {
      const tasks: Promise<void>[] = [this.client.connect()];
      if (this.subClient) tasks.push(this.subClient.connect());
      await Promise.all(tasks);
    } catch {
      // Redis tùy chọn: lỗi khởi động không chặn app; lệnh sau vẫn thử reconnect theo ioredis
    }
  }

  // ... (existing methods)

  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    if (!this.subClient) return;
    await this.subClient.subscribe(channel);
    this.subClient.on('message', (chan, msg) => {
      if (chan === channel) callback(msg);
    });
  }

  /**
   * Track keys by user to avoid KEYS command
   */
  async trackKey(userId: number, key: string): Promise<void> {
    await this.sadd(`rbac:u:${userId}:keys`, key);
  }

  async getTrackedKeys(userId: number): Promise<string[]> {
    return this.smembers(`rbac:u:${userId}:keys`);
  }

  async clearTrackedKeys(userId: number): Promise<void> {
    await this.del(`rbac:u:${userId}:keys`);
  }

  isEnabled(): boolean {
    return !!this.client;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.client) return;
    if (ttlSeconds && ttlSeconds > 0) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.client) return null;
    return this.client.get(key);
  }

  /** Một round-trip cho nhiều key (Redis MGET). */
  async mget(...keys: string[]): Promise<(string | null)[]> {
    if (!this.client || keys.length === 0) return keys.map(() => null);
    const out = await this.client.mget(...keys);
    return out.map((v) => (v == null ? null : v));
  }

  async del(key: string): Promise<void> {
    if (!this.client) return;
    await this.client.del(key);
  }

  /**
   * FLUSHDB — xóa mọi key trong Redis DB đang chọn (cache app, RBAC cache, throttle, blacklist trong cùng DB, …).
   */
  async flushDb(): Promise<void> {
    if (!this.client) return;
    await this.client.flushdb();
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    if (!this.client || ttlSeconds <= 0) return;
    await this.client.expire(key, ttlSeconds);
  }

  async exists(key: string): Promise<boolean> {
    if (!this.client) return false;
    return (await this.client.exists(key)) === 1;
  }

  /** Gộp UNLINK nhiều key trong một round-trip (ít RTT hơn del tuần tự). */
  async unlinkMany(keys: string[]): Promise<void> {
    if (!this.client || keys.length === 0) return;
    const pipeline = this.client.pipeline();
    for (const k of keys) {
      pipeline.unlink(k);
    }
    await pipeline.exec();
  }

  /** Gom nhiều lệnh Redis vào một round-trip (pipeline). Không gắn logic nghiệp vụ cụ thể. */
  async withPipeline(handler: (pipe: ChainableCommander) => void): Promise<void> {
    if (!this.client) return;
    const p = this.client.pipeline();
    handler(p);
    await p.exec();
  }

  async hdel(key: string, ...fields: string[]): Promise<void> {
    if (!this.client || fields.length === 0) return;
    await this.client.hdel(key, ...fields);
  }

  async hget(key: string, field: string): Promise<string | null> {
    if (!this.client) return null;
    return this.client.hget(key, field);
  }

  async hset(key: string, field: string, value: string): Promise<void> {
    if (!this.client) return;
    await this.client.hset(key, field, value);
  }

  /** Bulk HSET for a hash key (single RTT via pipeline). */
  async hmset(key: string, entries: Record<string, string>): Promise<void> {
    if (!this.client) return;
    const fields = Object.entries(entries);
    if (fields.length === 0) return;
    const p = this.client.pipeline();
    for (const [field, value] of fields) {
      p.hset(key, field, value);
    }
    await p.exec();
  }

  async hincrby(key: string, field: string, increment: number): Promise<number> {
    if (!this.client) return 0;
    return this.client.hincrby(key, field, increment);
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    if (!this.client) return {};
    return this.client.hgetall(key);
  }

  async rename(oldKey: string, newKey: string): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.rename(oldKey, newKey);
    } catch (e) {
      if (e.message !== 'ERR no such key') {
        throw e;
      }
    }
  }

  async keys(pattern: string): Promise<string[]> {
    if (!this.client) return [];
    return this.client.keys(pattern);
  }

  async scan(pattern: string, count = 100): Promise<string[]> {
    if (!this.client) return [];
    const keys: string[] = [];
    let cursor = '0';
    do {
      const [nextCursor, foundKeys] = await this.client.scan(cursor, 'MATCH', pattern, 'COUNT', count);
      keys.push(...foundKeys);
      cursor = nextCursor;
    } while (cursor !== '0');
    return keys;
  }

  async lock(key: string, ttlSeconds: number, token = 'locked'): Promise<boolean> {
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

  async sadd(key: string, ...values: string[]): Promise<void> {
    if (!this.client || values.length === 0) return;
    await this.client.sadd(key, ...values);
  }

  async sismember(key: string, value: string): Promise<boolean> {
    if (!this.client) return false;
    const result = await this.client.sismember(key, value);
    return result === 1;
  }

  async smembers(key: string): Promise<string[]> {
    if (!this.client) return [];
    return this.client.smembers(key);
  }

  async srem(key: string, ...values: string[]): Promise<void> {
    if (!this.client || values.length === 0) return;
    await this.client.srem(key, ...values);
  }

  async publish(channel: string, message: string): Promise<void> {
    if (!this.client) return;
    await this.client.publish(channel, message);
  }

  async onModuleDestroy() {
    if (this.client) {
      try { await this.client.quit(); } catch { }
      this.client = null;
    }
  }
}



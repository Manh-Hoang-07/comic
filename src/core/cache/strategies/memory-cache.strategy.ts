import { Injectable } from '@nestjs/common';
import { LRUCache } from 'lru-cache';
import { EventEmitter } from 'events';
import { ICacheStrategy } from '../interfaces/cache-strategy.interface';

@Injectable()
export class MemoryCacheStrategy implements ICacheStrategy {
  private cache: LRUCache<string, string>;
  private hashes: Map<string, Map<string, string>> = new Map();
  private sets: Map<string, Set<string>> = new Map();
  private emitter = new EventEmitter();

  constructor() {
    this.cache = new LRUCache({
      max: 5000, // max 5000 items
      ttl: 1000 * 60 * 60, // default 1h
    });
  }

  isEnabled(): boolean {
    return true;
  }

  async onModuleInit(): Promise<void> {}
  async onModuleDestroy(): Promise<void> {}

  async get(key: string): Promise<string | null> {
    return this.cache.get(key) || null;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    this.cache.set(key, value, {
      ttl: ttlSeconds ? ttlSeconds * 1000 : undefined,
    });
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
    this.hashes.delete(key);
    this.sets.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    return this.cache.has(key) || this.hashes.has(key) || this.sets.has(key);
  }

  async mget(...keys: string[]): Promise<(string | null)[]> {
    return keys.map((k) => this.cache.get(k) || null);
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    const val = this.cache.get(key);
    if (val) {
      this.cache.set(key, val, { ttl: ttlSeconds * 1000 });
    }
  }

  async flushDb(): Promise<void> {
    this.cache.clear();
    this.hashes.clear();
    this.sets.clear();
  }

  async unlinkMany(keys: string[]): Promise<void> {
    keys.forEach((k) => this.del(k));
  }

  async rename(oldKey: string, newKey: string): Promise<void> {
    const val = this.cache.get(oldKey);
    if (val) {
      this.cache.set(newKey, val);
      this.cache.delete(oldKey);
    }
  }

  async keys(pattern: string): Promise<string[]> {
    // Very basic pattern matching (supporting only * at end)
    const allKeys = Array.from(this.cache.keys()) as string[];
    if (pattern === '*') return allKeys;
    const base = pattern.replace('*', '');
    return allKeys.filter((k) => k.startsWith(base));
  }

  async scan(pattern: string): Promise<string[]> {
    return this.keys(pattern);
  }

  // Hashes
  async hset(key: string, field: string, value: string): Promise<void> {
    if (!this.hashes.has(key)) this.hashes.set(key, new Map());
    this.hashes.get(key)!.set(field, value);
  }

  async hget(key: string, field: string): Promise<string | null> {
    return this.hashes.get(key)?.get(field) || null;
  }

  async hdel(key: string, ...fields: string[]): Promise<void> {
    const map = this.hashes.get(key);
    if (map) {
      fields.forEach((f) => map.delete(f));
    }
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    const map = this.hashes.get(key);
    if (!map) return {};
    return Object.fromEntries(map);
  }

  async hincrby(
    key: string,
    field: string,
    increment: number,
  ): Promise<number> {
    const map = this.hashes.get(key);
    if (!map) {
      this.hset(key, field, String(increment));
      return increment;
    }
    const current = parseInt(map.get(field) || '0', 10);
    const next = current + increment;
    map.set(field, String(next));
    return next;
  }

  // Sets
  async sadd(key: string, ...values: string[]): Promise<void> {
    if (!this.sets.has(key)) this.sets.set(key, new Set());
    const set = this.sets.get(key)!;
    values.forEach((v) => set.add(v));
  }

  async smembers(key: string): Promise<string[]> {
    return Array.from(this.sets.get(key) || []);
  }

  async sismember(key: string, value: string): Promise<boolean> {
    return this.sets.get(key)?.has(value) || false;
  }

  async srem(key: string, ...values: string[]): Promise<void> {
    const set = this.sets.get(key);
    if (set) {
      values.forEach((v) => set.delete(v));
    }
  }

  // PubSub (Local only)
  async publish(channel: string, message: string): Promise<void> {
    this.emitter.emit(channel, message);
  }

  async subscribe(
    channel: string,
    callback: (message: string) => void,
  ): Promise<void> {
    this.emitter.on(channel, callback);
  }

  // Locking (In-memory, single process only)
  async lock(
    key: string,
    ttlSeconds: number,
    token = 'locked',
  ): Promise<boolean> {
    if (this.cache.has(`lock:${key}`)) return false;
    this.cache.set(`lock:${key}`, token, { ttl: ttlSeconds * 1000 });
    return true;
  }

  async unlock(key: string, token = 'locked'): Promise<void> {
    const currentToken = this.cache.get(`lock:${key}`);
    if (currentToken === token) {
      this.cache.delete(`lock:${key}`);
    }
  }

  async withPipeline(handler: any): Promise<void> {
    // Pipeline doesn't really matter for in-memory, just execute it
    const pipe = {
      exec: async () => {},
      // Mock other methods if needed, but for now we just provide the structure
    };
    handler(pipe);
  }
}

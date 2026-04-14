import { ChainableCommander } from 'ioredis';

export interface ICacheStrategy {
  isEnabled(): boolean;
  onModuleInit(): Promise<void>;
  onModuleDestroy(): Promise<void>;

  // Basic Ops
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  mget(...keys: string[]): Promise<(string | null)[]>;
  expire(key: string, ttlSeconds: number): Promise<void>;
  flushDb(): Promise<void>;
  unlinkMany(keys: string[]): Promise<void>;
  rename(oldKey: string, newKey: string): Promise<void>;
  keys(pattern: string): Promise<string[]>;
  scan(pattern: string, count?: number): Promise<string[]>;

  // Hashes
  hset(key: string, field: string, value: string): Promise<void>;
  hget(key: string, field: string): Promise<string | null>;
  hdel(key: string, ...fields: string[]): Promise<void>;
  hgetall(key: string): Promise<Record<string, string>>;
  hincrby(key: string, field: string, increment: number): Promise<number>;

  // Sets
  sadd(key: string, ...values: string[]): Promise<void>;
  smembers(key: string): Promise<string[]>;
  sismember(key: string, value: string): Promise<boolean>;
  srem(key: string, ...values: string[]): Promise<void>;

  // PubSub
  publish(channel: string, message: string): Promise<void>;
  subscribe(
    channel: string,
    callback: (message: string) => void,
  ): Promise<void>;

  // Locking
  lock(key: string, ttlSeconds: number, token?: string): Promise<boolean>;
  unlock(key: string, token?: string): Promise<void>;

  // Utilities
  withPipeline(handler: (pipe: ChainableCommander) => void): Promise<void>;
}

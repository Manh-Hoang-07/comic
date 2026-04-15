import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { createHash } from 'crypto';
import { RedisUtil } from '@/core/utils/redis.util';
import { TokenLocalStore } from './token-local-store';

const MAX_ENTRIES = 10_000;
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const REDIS_KEY_PREFIX = 'auth:blacklist:';
const LOCAL_SYNC_TTL_SECONDS = 300; // 5 minutes — safe default when syncing from Redis

@Injectable()
export class TokenBlacklistService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TokenBlacklistService.name);
  private readonly localStore = new TokenLocalStore(MAX_ENTRIES);
  private cleanupInterval?: NodeJS.Timeout;

  constructor(private readonly redis: RedisUtil) {}

  onModuleInit(): void {
    this.cleanupInterval = setInterval(() => {
      const removed = this.localStore.cleanup();
      if (removed > 0) {
        this.logger.log(
          `Token blacklist cleanup: removed ${removed} expired entries. ` +
            `Current size: ${this.localStore.size}/${MAX_ENTRIES}`,
        );
      }
    }, CLEANUP_INTERVAL_MS);
  }

  onModuleDestroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /** Add a token to the blacklist with a TTL (seconds). */
  async add(token: string, ttlSeconds: number): Promise<void> {
    if (this.redis?.isEnabled()) {
      await this.redis
        .set(this.redisKey(token), '1', ttlSeconds)
        .catch(() => this.localStore.add(token, ttlSeconds));
    } else {
      this.localStore.add(token, ttlSeconds);
    }
  }

  /**
   * Fast synchronous check against in-memory store only.
   * Use this in hot paths where you don't need Redis consistency.
   */
  isBlacklisted(token: string): boolean {
    return this.localStore.has(token);
  }

  /**
   * Full check: Redis first, then in-memory fallback.
   * Use this when cross-instance consistency matters (e.g. in the auth guard).
   */
  async has(token: string): Promise<boolean> {
    // 1. Quick check against local instance's memory store first
    if (this.localStore.has(token)) return true;

    // 2. Check Redis for global consistency
    if (this.redis?.isEnabled()) {
      const val = await this.redis.get(this.redisKey(token));
      if (val) {
        // Sync back to local store so future checks are fast (skip Redis round-trip)
        this.localStore.add(token, LOCAL_SYNC_TTL_SECONDS);
        return true;
      }
    }
    return false;
  }

  /** Return stats for monitoring/health endpoints. */
  getStats(): {
    size: number;
    maxSize: number;
    utilizationPercent: number;
    redisEnabled: boolean;
  } {
    return {
      ...this.localStore.stats(MAX_ENTRIES),
      redisEnabled: this.redis?.isEnabled() || false,
    };
  }

  // ── Private ────────────────────────────────────────────────────────────────

  private redisKey(token: string): string {
    const hash = createHash('sha256').update(token).digest('hex');
    return `${REDIS_KEY_PREFIX}${hash}`;
  }
}

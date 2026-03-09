/**
 * In-memory store for token blacklist entries.
 * Stores token → unix expiry timestamp (seconds).
 *
 * Responsibilities:
 * - add / check / evict tokens
 * - periodic cleanup of expired entries
 * - LRU eviction when the size limit is reached
 */
export class TokenLocalStore {
    private readonly map = new Map<string, number>();
    private readonly maxEntries: number;

    constructor(maxEntries = 10_000) {
        this.maxEntries = maxEntries;
    }

    get size(): number {
        return this.map.size;
    }

    /** Add a token with a TTL. Enforces size limit before adding. */
    add(token: string, ttlSeconds: number): void {
        this.ensureCapacity();
        const now = epochSeconds();
        this.map.set(token, now + Math.max(1, ttlSeconds | 0));
    }

    /** Check if a token is blacklisted (fast, synchronous). */
    has(token: string): boolean {
        const exp = this.map.get(token);
        if (exp === undefined) return false;
        if (exp <= epochSeconds()) {
            this.map.delete(token);
            return false;
        }
        return true;
    }

    /** Remove all expired entries. Returns count of removed entries. */
    cleanup(): number {
        const now = epochSeconds();
        let removed = 0;
        for (const [token, exp] of this.map.entries()) {
            if (exp <= now) {
                this.map.delete(token);
                removed++;
            }
        }
        return removed;
    }

    /** Stats snapshot for monitoring. */
    stats(maxEntries: number) {
        return {
            size: this.map.size,
            maxSize: maxEntries,
            utilizationPercent: (this.map.size / maxEntries) * 100,
        };
    }

    // ── Private ───────────────────────────────────────────────────────────────

    private ensureCapacity(): void {
        if (this.map.size < this.maxEntries) return;

        // Cleanup expired first
        this.cleanup();

        // If still at capacity, evict the oldest entry
        if (this.map.size >= this.maxEntries) {
            const oldest = [...this.map.entries()].sort((a, b) => a[1] - b[1])[0];
            if (oldest) this.map.delete(oldest[0]);
        }
    }
}

function epochSeconds(): number {
    return Math.floor(Date.now() / 1000);
}

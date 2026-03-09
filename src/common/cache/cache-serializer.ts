/**
 * Serialize a value to a string safe for Redis storage.
 * - Strings: stored as-is.
 * - Objects/arrays: JSON-stringified with BigInt and circular-reference support.
 */
export function serializeForCache(value: any): string {
    if (typeof value === 'string') return value;

    const seen = new Set<object>();
    return JSON.stringify(value, (_key, v) => {
        if (typeof v === 'bigint') return v.toString();
        if (typeof v === 'object' && v !== null) {
            if (seen.has(v)) return '[Circular]';
            seen.add(v);
        }
        return v;
    });
}

/**
 * Deserialize a string value retrieved from Redis back to its original type.
 * Falls back to the raw string if JSON.parse fails.
 */
export function deserializeFromCache<T>(raw: string): T {
    try {
        return JSON.parse(raw) as T;
    } catch {
        return raw as unknown as T;
    }
}

/**
 * Determine whether a cached value should be treated as a cache miss
 * (i.e., the caller should refresh the cache).
 *
 * Rules:
 * - undefined  → miss
 * - empty string → miss
 * - empty plain object `{}` → miss  (arrays and other types are valid hits)
 */
export function isCacheMiss(value: any): boolean {
    if (value === undefined) return true;
    if (typeof value === 'string' && value.trim().length === 0) return true;
    if (
        value !== null &&
        typeof value === 'object' &&
        value.constructor === Object &&
        Object.keys(value).length === 0
    ) {
        return true;
    }
    return false;
}

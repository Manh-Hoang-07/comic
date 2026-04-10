/**
 * In-process L1 for decoded AssignedPermissionsBitmap (short TTL, same instance only).
 */
export class RbacBitmapL1Cache {
  private readonly store = new Map<string, { data: Uint8Array; expiry: number }>();

  constructor(private readonly ttlMs: number) {}

  getValid(key: string): Uint8Array | undefined {
    const e = this.store.get(key);
    if (!e || e.expiry <= Date.now()) return undefined;
    return e.data;
  }

  set(key: string, data: Uint8Array): void {
    this.store.set(key, { data, expiry: Date.now() + this.ttlMs });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  hasValid(key: string): boolean {
    const e = this.store.get(key);
    return !!e && e.expiry > Date.now();
  }

  /** Drop L1 entries whose Redis key path includes this user segment. */
  deleteByUserId(userId: unknown): void {
    const needle = `:u:${userId}:`;
    for (const k of this.store.keys()) {
      if (k.includes(needle)) this.store.delete(k);
    }
  }
}

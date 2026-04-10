export class L1TtlCache<T> {
  private value: T | undefined;
  private expiresAt = 0;

  constructor(private readonly ttlMs: number) {}

  getValid(now = Date.now()): T | undefined {
    if (this.expiresAt <= now) return undefined;
    return this.value;
  }

  set(value: T, now = Date.now()): void {
    this.value = value;
    this.expiresAt = now + this.ttlMs;
  }

  clear(): void {
    this.value = undefined;
    this.expiresAt = 0;
  }
}


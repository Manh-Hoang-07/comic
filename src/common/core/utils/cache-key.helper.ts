/**
 * JSON.stringify object với thứ tự key cố định (sort A→Z) — phần khóa cache ổn định cho query/option flat.
 * Không dùng cho object lồng sâu có thứ tự key khác biệt giữa lần gọi; với query string phẳng thì đủ.
 */
export function stableObjectJsonForCache(input: any): string {
  const raw =
    input && typeof input === 'object' && !Array.isArray(input)
      ? { ...input }
      : {};
  const sorted: Record<string, unknown> = {};
  for (const k of Object.keys(raw).sort()) {
    sorted[k] = raw[k];
  }
  return JSON.stringify(sorted);
}

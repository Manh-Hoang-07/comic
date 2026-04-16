/** Wire format for Redis: prefix + JSON array of sorted unique permission codes. */
export const RBAC_ASSIGNED_CODES_PREFIX = 'codes:v1:' as const;

export function encodeAssignedCodes(codes: Iterable<string>): string {
  const uniq = Array.from(
    new Set(
      Array.from(codes).filter((c) => typeof c === 'string' && c.length > 0),
    ),
  ).sort((a, b) => a.localeCompare(b));
  return `${RBAC_ASSIGNED_CODES_PREFIX}${JSON.stringify(uniq)}`;
}

export function decodeAssignedCodes(raw: string): string[] | null {
  if (!raw?.startsWith(RBAC_ASSIGNED_CODES_PREFIX)) return null;
  try {
    const parsed = JSON.parse(raw.slice(RBAC_ASSIGNED_CODES_PREFIX.length));
    if (!Array.isArray(parsed)) return null;
    return parsed.filter(
      (x): x is string => typeof x === 'string' && x.length > 0,
    );
  } catch {
    return null;
  }
}

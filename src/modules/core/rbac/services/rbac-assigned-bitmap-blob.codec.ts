/** Wire format for Redis value: prefix + base64(bytes). */
export const RBAC_ASSIGNED_BITMAP_BLOB_PREFIX = 'b64:v1:' as const;

export function encodeAssignedBitmapBlob(bitmap: Uint8Array): string {
  if (!bitmap || bitmap.length === 0) return RBAC_ASSIGNED_BITMAP_BLOB_PREFIX;
  const b64 = Buffer.from(bitmap).toString('base64');
  return `${RBAC_ASSIGNED_BITMAP_BLOB_PREFIX}${b64}`;
}

export function decodeAssignedBitmapBlob(raw: string): Uint8Array {
  if (!raw) return new Uint8Array();
  if (!raw.startsWith(RBAC_ASSIGNED_BITMAP_BLOB_PREFIX)) {
    return new Uint8Array();
  }
  const b64 = raw.slice(RBAC_ASSIGNED_BITMAP_BLOB_PREFIX.length);
  if (!b64) return new Uint8Array();
  try {
    return new Uint8Array(Buffer.from(b64, 'base64'));
  } catch {
    return new Uint8Array();
  }
}

/**
 * DB_ID_TYPE controls how primary keys are handled:
 *  - 'bigint'   : numeric string/number → BigInt (default, PostgreSQL autoincrement)
 *  - 'uuid'     : string as-is (PostgreSQL gen_random_uuid / @default(uuid()))
 *  - 'objectid' : string as-is (MongoDB ObjectId)
 *
 * Set in .env:  DB_ID_TYPE=bigint | uuid | objectid
 * When switching DB, only this env var + Prisma schema need to change.
 */
export type DbIdType = 'bigint' | 'uuid' | 'objectid';

export function getDbIdType(): DbIdType {
  return (process.env.DB_ID_TYPE as DbIdType) || 'bigint';
}

/**
 * Unified helper to normalize a primary key.
 * Behavior is driven by DB_ID_TYPE env variable:
 *  - bigint   → converts numeric strings/numbers to BigInt
 *  - uuid     → returns value as-is (string)
 *  - objectid → returns value as-is (string)
 *
 * Use this in Repositories before passing IDs to Prisma queries.
 * No changes needed here when switching DB — just update DB_ID_TYPE in .env.
 */
export function toPrimaryKey(id: any): any {
  if (id === null || id === undefined || id === '') return id;

  // Unwrap object with 'id' property
  if (typeof id === 'object' && 'id' in id) {
    return toPrimaryKey((id as any).id);
  }

  const idType = getDbIdType();

  if (idType === 'uuid' || idType === 'objectid') {
    // String-based IDs — return as string, no conversion
    return typeof id === 'string' ? id : String(id);
  }

  // Default: bigint mode
  if (typeof id === 'bigint') return id;
  if (typeof id === 'number') return BigInt(id);
  if (typeof id === 'string' && /^\d+$/.test(id)) {
    try {
      return BigInt(id);
    } catch {
      return id;
    }
  }

  return id;
}

/**
 * Type alias for primary keys across the system.
 */
export type PrimaryKey = string | bigint | number;

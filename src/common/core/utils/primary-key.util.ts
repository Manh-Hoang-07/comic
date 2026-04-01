/**
 * Helper to check if a string is a valid UUID.
 */
function isUUID(id: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

/**
 * Helper to check if a string is a valid MongoDB ObjectId.
 */
function isObjectId(id: string): boolean {
    return /^[0-9a-fA-F]{24}$/.test(id);
}

/**
 * Unified helper to convert input to primary key type.
 * Supports:
 * - BigInt (automatically converted from numeric strings or numbers)
 * - UUID (kept as string)
 * - ObjectId (kept as string)
 * 
 * Use this in Repositories before passing IDs to Prisma queries.
 */
export function toPrimaryKey(id: any): any {
    if (id === null || id === undefined || id === '') return id;

    // Handle object with 'id' property
    if (typeof id === 'object' && 'id' in id) {
        return toPrimaryKey((id as any).id);
    }

    if (typeof id === 'bigint') return id;
    if (typeof id === 'number') return BigInt(id);

    if (typeof id === 'string') {
        // 1. UUID or ObjectId - return as-is
        if (isUUID(id) || isObjectId(id)) {
            return id;
        }

        // 2. Numeric string - convert to BigInt
        if (/^\d+$/.test(id)) {
            try {
                return BigInt(id);
            } catch {
                return id;
            }
        }
    }

    return id;
}

/**
 * Type alias for primary keys across the system.
 */
export type PrimaryKey = string | any;

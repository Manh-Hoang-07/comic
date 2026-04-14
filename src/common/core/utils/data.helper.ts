/**
 * Normalizes input to an array of IDs.
 * Useful for IDs from request payloads (UUID, BigInt, etc.).
 */
export function normalizeIdArray(input: any): any[] | null {
  if (input === undefined) return null;
  if (!Array.isArray(input)) return [];
  return input.filter((id: any) => id !== null && id !== undefined);
}

/**
 * Ensures a value is properly formatted for a Primary Key.
 * Supports BigInt (as fallback), UUID, and ObjectId.
 */
export function toBigInt(value?: any): any | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'bigint') return value;

  if (typeof value === 'string') {
    // UUID or ObjectId
    if (
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        value,
      ) ||
      /^[0-9a-fA-F]{24}$/.test(value)
    ) {
      return value;
    }
    // Numeric string
    if (/^\d+$/.test(value)) {
      try {
        return BigInt(value);
      } catch {
        return value;
      }
    }
  }

  if (typeof value === 'number') {
    try {
      return BigInt(value);
    } catch {
      return value;
    }
  }

  return value;
}

/**
 * Normalizes a date input to a Date object or null.
 */
export function normalizeDate(input: any): Date | null | undefined {
  if (input === null) return null;
  if (input === undefined) return undefined;
  if (input instanceof Date) return input;
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

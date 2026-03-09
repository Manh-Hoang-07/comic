/**
 * Normalizes input to an array of numbers.
 * Useful for IDs from request payloads.
 */
export function normalizeIdArray(input: any): number[] | null {
    if (input === undefined) return null;
    if (!Array.isArray(input)) return [];
    return input.map((id: any) => Number(id)).filter((id) => !Number.isNaN(id));
}

/**
 * Ensures a value is a BigInt or null.
 */
export function toBigInt(value?: number | string | bigint | null): bigint | null {
    if (value === null || value === undefined) return null;
    if (typeof value === 'bigint') return value;
    const num = typeof value === 'string' ? Number(value) : value;
    if (Number.isNaN(num)) return null;
    return BigInt(num);
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

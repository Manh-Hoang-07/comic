/**
 * Helper to convert input to primary key type (default BigInt for this project).
 * Handles raw values, objects containing IDs, and numeric strings.
 * 
 * @throws Error if the ID format is invalid for conversion.
 */
export function toPrimaryKey(id: any): any {
    if (id && typeof id === 'object' && 'id' in id) {
        return toPrimaryKey((id as any).id);
    }

    if (typeof id === 'bigint') return id;

    if (typeof id === 'number') {
        try {
            return BigInt(id);
        } catch {
            return id;
        }
    }

    if (typeof id === 'string') {
        if (!/^\d+$/.test(id)) {
            throw new Error(`Invalid ID format: ${id}. Expected a numeric string.`);
        }
        try {
            return BigInt(id);
        } catch {
            throw new Error(`Invalid ID format: ${id}. Cannot convert to BigInt.`);
        }
    }

    return id;
}

/**
 * Parses a sort string like "field:dir,field2:dir" into Prisma-compatible OrderBy input.
 */
export function parseSort(sortStr: string): Record<string, 'asc' | 'desc'>[] {
    if (!sortStr) return [];

    return sortStr.split(',').map((s) => {
        const [field, dir] = s.trim().split(':');
        return { [field]: dir?.toLowerCase() === 'asc' ? 'asc' : 'desc' } as any;
    });
}

/**
 * Resolves selection logic for Prisma queries.
 * Prisma doesn't allow using both `select` and `include` at the same time.
 * 
 * Order of precedence:
 * 1. Explicit `select` from request options
 * 2. Explicit `include` from request options (if `select` is absent)
 * 3. Default `select` defined in the repository
 * 4. Default `include` defined in the repository (if default `select` is absent)
 */
export function resolveQuerySelection(
    options: { select?: any; include?: any },
    defaults: { select?: any; include?: any },
): { select?: any; include?: any } {
    const hasRequestSelect = !!options.select;
    const hasRequestInclude = !!options.include;

    if (hasRequestSelect) {
        return { select: options.select };
    }

    if (hasRequestInclude) {
        return { include: options.include };
    }

    if (defaults.select) {
        return { select: defaults.select };
    }

    if (defaults.include) {
        return { include: defaults.include };
    }

    return {};
}

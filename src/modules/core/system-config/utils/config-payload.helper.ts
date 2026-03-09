/**
 * Builds a payload for create or update operations, specifically handling BigInt fields
 * and removing undefined values if necessary.
 */
export function buildConfigPayload<T extends object>(
    dto: T,
    bigIntFields: string[],
    updatedBy?: number,
    existing?: any,
): any {
    const payload: any = { ...dto };

    // Convert BigInt fields
    bigIntFields.forEach((field) => {
        if (payload[field] !== undefined) {
            payload[field] = payload[field] ? BigInt(payload[field]) : null;
        }
    });

    // Handle Audit Fields
    if (updatedBy) {
        const pk = BigInt(updatedBy);
        if (!existing) {
            payload.created_user_id = pk;
        }
        payload.updated_user_id = pk;
    }

    // Remove undefined to avoid Prisma errors if not intended
    Object.keys(payload).forEach((key) => {
        if (payload[key] === undefined) {
            delete payload[key];
        }
    });

    return payload;
}

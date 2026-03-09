/**
 * Common selection/inclusion for Comment queries to ensure consistent tree structure.
 */
export const COMMENT_TREE_INCLUDE = {
    user: {
        select: {
            id: true,
            name: true,
            username: true,
            email: true,
            image: true,
        },
    },
    comic: {
        select: { id: true, title: true, slug: true },
    },
    chapter: {
        select: { id: true, title: true, chapter_index: true },
    },
    replies: {
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                },
            },
            replies: {
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            image: true,
                        },
                    },
                },
            },
        },
    },
};

/**
 * Normalizes comment filters for Prisma and common business logic.
 */
export function normalizeCommentFilters(filters: any) {
    const prepared = { ...filters };

    // Level normalization (default to root comments)
    if (prepared.parent_id !== undefined) {
        if (prepared.parent_id === null || prepared.parent_id === 'null') {
            prepared.parent_id = null;
        } else {
            prepared.parent_id = Number(prepared.parent_id);
        }
    } else {
        prepared.parent_id = null;
    }

    // Search logic
    if (prepared.search) {
        prepared.content = { contains: prepared.search };
        delete prepared.search;
    }

    // Date range logic
    if (prepared.date_from || prepared.date_to) {
        prepared.created_at = {};
        if (prepared.date_from) {
            prepared.created_at.gte = new Date(prepared.date_from);
            delete prepared.date_from;
        }
        if (prepared.date_to) {
            prepared.created_at.lte = new Date(prepared.date_to);
            delete prepared.date_to;
        }
    }

    return prepared;
}

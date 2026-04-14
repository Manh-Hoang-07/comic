/**
 * Common inclusion for Post Comment tree queries.
 */
export const POST_COMMENT_TREE_INCLUDE = {
  user: {
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      image: true,
    },
  },
  post: {
    select: { id: true, name: true, slug: true },
  },
  replies: {
    include: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
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
              username: true,
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
 * Normalizes post comment filters for Prisma and common business logic.
 */
export function normalizePostCommentFilters(filters: any) {
  const prepared = { ...filters };

  // Map snake_case to camelCase expected by Repository
  if (prepared.post_id) {
    prepared.postId = prepared.post_id;
    delete prepared.post_id;
  }

  if (prepared.user_id) {
    prepared.userId = prepared.user_id;
    delete prepared.user_id;
  }

  // Handle parent_id logic
  if (prepared.parent_id !== undefined) {
    if (prepared.parent_id === 'null' || prepared.parent_id === null) {
      prepared.parentId = null;
    } else {
      prepared.parentId = prepared.parent_id;
    }
    delete prepared.parent_id;
  }

  // Map date filters
  if (prepared.date_from) {
    prepared.startDate = prepared.date_from;
    delete prepared.date_from;
  }
  if (prepared.date_to) {
    prepared.endDate = prepared.date_to;
    delete prepared.date_to;
  }

  return prepared;
}

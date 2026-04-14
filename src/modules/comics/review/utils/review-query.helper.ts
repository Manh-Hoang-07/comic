/**
 * Common selection/inclusion for Review queries.
 */
export const REVIEW_INCLUDE = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
    },
  },
  comic: true,
};

/**
 * Normalizes review filters for Prisma and common business logic.
 */
export function normalizeReviewFilters(filters: any) {
  const prepared = { ...filters };

  // Rating normalization
  if (prepared.rating) {
    prepared.rating = Number(prepared.rating);
  }

  if (prepared.rating_min || prepared.rating_max) {
    prepared.rating = {};
    if (prepared.rating_min) {
      prepared.rating.gte = Number(prepared.rating_min);
      delete prepared.rating_min;
    }
    if (prepared.rating_max) {
      prepared.rating.lte = Number(prepared.rating_max);
      delete prepared.rating_max;
    }
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

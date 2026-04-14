import { ComicReview } from '@prisma/client';
import { IRepository } from '@/common/core/repositories';

export const REVIEW_REPOSITORY = 'IReviewRepository';

export interface ReviewFilter {
  user_id?: any;
  comic_id?: any;
  rating?: number;
  group_id?: any;
}

export interface IReviewRepository extends IRepository<ComicReview> {
  syncRatingStats(comicId: any): Promise<void>;
  getAverageRating(filter?: Record<string, any>): Promise<number>;
  getRatingDistribution(filter?: Record<string, any>): Promise<any[]>;
}

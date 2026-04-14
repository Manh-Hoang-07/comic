import { PostStats } from '@prisma/client';
import { IRepository } from '@/common/core/repositories';

export const POST_STATS_REPOSITORY = 'IPostStatsRepository';

export interface PostStatsFilter {
  post_id?: any;
  group_id?: any;
}

export interface IPostStatsRepository extends IRepository<PostStats> {
  sum(field: keyof PostStats, filter?: PostStatsFilter): Promise<number>;
  incrementViews(postId: any, count: number): Promise<void>;
  getDailyViewStats(
    postId: any,
    startDate: Date,
    endDate: Date,
  ): Promise<any[]>;
}

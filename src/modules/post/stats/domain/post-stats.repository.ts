import { PostStats } from '@prisma/client';
import { IRepository } from '@/common/core/repositories';

export const POST_STATS_REPOSITORY = 'IPostStatsRepository';

export interface PostStatsFilter {
  post_id?: number | bigint;
  group_id?: number | bigint;
}

export interface IPostStatsRepository extends IRepository<PostStats> {
  sum(field: keyof PostStats, filter?: PostStatsFilter): Promise<number>;
  incrementViews(postId: number | bigint, count: number): Promise<void>;
  getDailyViewStats(postId: number | bigint, startDate: Date, endDate: Date): Promise<any[]>;
}


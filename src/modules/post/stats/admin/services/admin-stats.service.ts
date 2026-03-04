import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '@/core/database/prisma/prisma.service';
import { getGroupFilter } from '@/common/shared/utils/group-ownership.util';
import { IPostRepository, POST_REPOSITORY } from '@/modules/post/post/domain/post.repository';
import { IPostStatsRepository, POST_STATS_REPOSITORY } from '../../domain/post-stats.repository';

@Injectable()
export class AdminPostStatsService {
  constructor(
    @Inject(POST_REPOSITORY)
    private readonly postRepository: IPostRepository,
    @Inject(POST_STATS_REPOSITORY)
    private readonly statsRepository: IPostStatsRepository,
    private readonly prisma: PrismaService,
  ) { }

  async getStatisticsOverview() {
    const filter = getGroupFilter();

    const [totalPosts, publishedPosts, draftPosts, scheduledPosts, totalComments, pendingComments, totalViews, topViewedPosts] =
      await Promise.all([
        this.postRepository.count(filter as any),
        this.postRepository.count({ ...(filter as any), status: 'published' } as any),
        this.postRepository.count({ ...(filter as any), status: 'draft' } as any),
        this.postRepository.count({ ...(filter as any), status: 'scheduled' } as any),
        (this.prisma as any).postComment.count(filter.group_id ? { where: { post: { group_id: BigInt(filter.group_id as any) } } } : undefined),
        (this.prisma as any).postComment.count(
          filter.group_id
            ? { where: { status: 'hidden', post: { group_id: BigInt(filter.group_id as any) } } }
            : { where: { status: 'hidden' } },
        ),
        this.statsRepository.sum('view_count', filter as any),
        this.postRepository.findMany(
          { ...(filter as any), status: 'published' } as any,
          { limit: 10, sort: 'view_count:desc' } as any,
        ),
      ]);

    return {
      total_posts: totalPosts,
      published_posts: publishedPosts,
      draft_posts: draftPosts,
      scheduled_posts: scheduledPosts,
      total_comments: totalComments,
      pending_comments: pendingComments,
      total_views_last_30_days: totalViews, // kept for backward compatibility
      top_viewed_posts: topViewedPosts,
    };
  }

  async getPostViews(postId: number, startDate: Date, endDate: Date) {
    return this.statsRepository.getDailyViewStats(postId, startDate, endDate);
  }

  async getViewsOverTime(startDate: Date, endDate: Date) {
    const filter = getGroupFilter();
    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const posts = await this.postRepository.findMany(filter as any, { select: { id: true } } as any);
    const postIds = (posts as any[]).map((p) => (p as any).id);
    if (postIds.length === 0) return [];

    const grouped = await (this.prisma as any).postDailyStats.groupBy({
      by: ['stat_date'],
      where: {
        post_id: { in: postIds },
        stat_date: {
          gte: start,
          lte: end,
        },
      },
      _sum: { view_count: true },
      orderBy: { stat_date: 'asc' },
    });

    return grouped.map((row: any) => ({
      date: row.stat_date.toISOString().split('T')[0],
      count: Number(row._sum.view_count || 0n),
    }));
  }
}


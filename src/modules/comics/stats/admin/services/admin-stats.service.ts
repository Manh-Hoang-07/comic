import { Injectable, Inject } from '@nestjs/common';
import {
  IComicRepository,
  COMIC_REPOSITORY,
} from '../../../comic/domain/comic.repository';
import {
  IComicStatsRepository,
  COMIC_STATS_REPOSITORY,
} from '../../domain/comic-stats.repository';
import {
  IComicViewRepository,
  COMIC_VIEW_REPOSITORY,
} from '../../domain/comic-view.repository';
import { getGroupFilter } from '@/common/shared/utils/group-ownership.util';
import { PrismaService } from '@/core/database/prisma/prisma.service';

@Injectable()
export class AdminStatsService {
  constructor(
    @Inject(COMIC_REPOSITORY)
    private readonly comicRepository: IComicRepository,
    @Inject(COMIC_STATS_REPOSITORY)
    private readonly statsRepository: IComicStatsRepository,
    @Inject(COMIC_VIEW_REPOSITORY)
    private readonly viewRepository: IComicViewRepository,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Dashboard analytics
   */
  async getDashboard() {
    const filter = getGroupFilter();

    const [totalComics, totalViews, totalFollows, topComics] =
      await Promise.all([
        this.comicRepository.count(filter as any),
        this.statsRepository.sum('view_count', filter),
        this.statsRepository.sum('follow_count', filter),
        this.statsRepository.findMany(filter, {
          sort: 'view_count:DESC',
          limit: 10,
          include: { comic: true },
        } as any),
      ]);

    return {
      total_comics: totalComics,
      total_views: totalViews,
      total_follows: totalFollows,
      top_comics: topComics.map((s) => ({
        comic: (s as any).comic,
        stats: s,
      })),
    };
  }

  /**
   * Top comics
   */
  async getTopComics(
    limit: number = 20,
    sortBy: 'views' | 'follows' | 'rating' = 'views',
  ) {
    const filter = getGroupFilter();

    const sort =
      sortBy === 'views'
        ? 'view_count:DESC'
        : sortBy === 'follows'
          ? 'follow_count:DESC'
          : 'rating_sum:DESC';

    const stats = await this.statsRepository.findMany(filter, {
      sort,
      take: limit,
      include: { comic: true },
    } as any);

    return stats.map((s) => ({
      comic: (s as any).comic,
      stats: s,
    }));
  }

  /**
   * Views over time
   */
  async getViewsOverTime(startDate: Date, endDate: Date) {
    const filter = getGroupFilter();
    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    // Lấy comic IDs theo group filter (nếu có) để groupBy theo ngày
    const comics = await this.comicRepository.findMany(
      filter as any,
      { select: { id: true } } as any,
    );
    const comicIds = (comics as any[]).map((c) => (c as any).id);

    if (comicIds.length === 0) return [];

    const grouped = await (this.prisma as any).comicDailyStats.groupBy({
      by: ['stat_date'],
      where: {
        comic_id: { in: comicIds },
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

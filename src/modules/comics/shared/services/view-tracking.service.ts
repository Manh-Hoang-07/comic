import { Injectable, Inject } from '@nestjs/common';
import {
  IComicViewRepository,
  COMIC_VIEW_REPOSITORY,
} from '../../stats/domain/comic-view.repository';
import {
  IComicStatsRepository,
  COMIC_STATS_REPOSITORY,
} from '../../stats/domain/comic-stats.repository';
import {
  IChapterRepository,
  CHAPTER_REPOSITORY,
} from '../../chapter/domain/chapter.repository';
import { PrismaService } from '@/core/database/prisma/prisma.service';
import {
  IComicRepository,
  COMIC_REPOSITORY,
} from '@/modules/comics/comic/domain/comic.repository';
import { toPrimaryKey } from '@/common/core/repositories/prisma-query.helper';

@Injectable()
export class ViewTrackingService {
  constructor(
    @Inject(COMIC_VIEW_REPOSITORY)
    private readonly viewRepository: IComicViewRepository,
    @Inject(COMIC_STATS_REPOSITORY)
    private readonly statsRepository: IComicStatsRepository,
    @Inject(CHAPTER_REPOSITORY)
    private readonly chapterRepository: IChapterRepository,
    @Inject(COMIC_REPOSITORY)
    private readonly comicRepository: IComicRepository,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Track view cho comic/chapter
   * Prevent duplicate views trong 1 giờ (IP + user_id)
   */
  async trackView(data: {
    comic_id: any;
    chapter_id?: number;
    user_id?: number;
    ip?: string;
    user_agent?: string;
  }) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    // Kiểm tra duplicate view
    const existingView = await this.viewRepository.findOne({
      comic_id: data.comic_id,
      chapter_id: data.chapter_id || null,
      user_id: data.user_id || null,
      ip: data.ip || null,
      date_from: oneHourAgo,
    });

    if (existingView) {
      return { tracked: false, reason: 'duplicate' };
    }

    // Tạo view record
    await this.viewRepository.create({
      comic_id: toPrimaryKey(data.comic_id),
      chapter_id: data.chapter_id ? toPrimaryKey(data.chapter_id) : null,
      user_id: data.user_id ? toPrimaryKey(data.user_id) : null,
      ip: data.ip || null,
      user_agent: data.user_agent || null,
    } as any);

    // Update stats (async, có thể dùng queue)
    await this.updateStats(data.comic_id, data.chapter_id);

    return { tracked: true };
  }

  /**
   * Aggregate views vào comic_stats
   */
  private async updateStats(comicId: any, chapterId?: number) {
    // Buffer increment view về comic thông qua repository (Redis + cron)
    await this.comicRepository.incrementView(comicId);

    // Update chapter view count nếu có
    if (chapterId) {
      const chapterViewCount = await this.viewRepository.count({
        chapter_id: chapterId,
      });

      await this.chapterRepository.update(chapterId, {
        view_count: BigInt(chapterViewCount),
      } as any);
    }
  }
}

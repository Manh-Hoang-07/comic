import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { Chapter } from '@prisma/client';
import { ChapterStatus } from '@/shared/enums/types/chapter-status.enum';
import {
  IChapterRepository,
  CHAPTER_REPOSITORY,
} from '../../domain/chapter.repository';
import {
  IChapterPageRepository,
  CHAPTER_PAGE_REPOSITORY,
} from '../../domain/chapter-page.repository';
import {
  IComicRepository,
  COMIC_REPOSITORY,
} from '../../../comic/domain/comic.repository';
import { ComicNotificationService } from '@/modules/comics/shared/services/comic-notification.service';
import { toPrimaryKey } from '@/common/core/utils/primary-key.util';

@Injectable()
export class ChapterActionService {
  constructor(
    @Inject(CHAPTER_REPOSITORY)
    private readonly chapterRepository: IChapterRepository,
    @Inject(CHAPTER_PAGE_REPOSITORY)
    private readonly pageRepository: IChapterPageRepository,
    @Inject(COMIC_REPOSITORY)
    private readonly comicRepository: IComicRepository,
    private readonly notificationService: ComicNotificationService,
  ) {}

  /**
   * Validates that chapter_index is unique within a comic.
   */
  async validateUniqueIndex(
    comicId: any,
    index: number,
    excludeId?: any,
  ): Promise<void> {
    const existing = await this.chapterRepository.findByComicIdAndIndex(
      comicId,
      index,
    );
    if (existing && (!excludeId || existing.id !== excludeId)) {
      throw new BadRequestException(
        `Chapter với index ${index} đã tồn tại trong comic này`,
      );
    }
  }

  /**
   * Syncs pages for a chapter (deletes old ones and creates new ones).
   */
  async syncPages(chapterId: any, pages: any[]): Promise<void> {
    if (!pages || !Array.isArray(pages)) return;

    // Delete existing pages
    await this.pageRepository.deleteMany({ chapter_id: chapterId });

    if (pages.length > 0) {
      await this.pageRepository.createMany(
        pages.map((p, i) => ({
          chapter_id: chapterId,
          page_number: i + 1,
          image_url: p.image_url,
          width: p.width,
          height: p.height,
          file_size: p.file_size ? toPrimaryKey(p.file_size) : null,
        })),
      );
    }
  }

  /**
   * Updates last chapter information on the parent comic.
   */
  async updateComicTimeline(comicId: any): Promise<void> {
    const lastChapter = await (
      this.chapterRepository as any
    ).delegate.findFirst({
      where: {
        comic_id: comicId,
        status: ChapterStatus.published,
      },
      orderBy: { chapter_index: 'desc' },
      select: { id: true, created_at: true },
    });

    await this.comicRepository.update(comicId, {
      last_chapter_id: lastChapter?.id || null,
      last_chapter_updated_at: lastChapter?.created_at || null,
    } as any);
  }

  /**
   * Sends notifications if the chapter is published.
   */
  async handleNotifications(chapter: Chapter): Promise<void> {
    if (chapter.status === ChapterStatus.published) {
      await this.notificationService.notifyNewChapter(chapter);
    }
  }
}

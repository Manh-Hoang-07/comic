import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Comic } from '@prisma/client';
import { BaseService } from '@/common/core/services';
import {
  IComicRepository,
  COMIC_REPOSITORY,
} from '../../domain/comic.repository';
import { RequestContext } from '@/common/shared/utils';
import { PUBLIC_COMIC_STATUSES } from '@/shared/enums';
import {
  IFollowRepository,
  FOLLOW_REPOSITORY,
} from '@/modules/comics/follow/domain/follow.repository';
import { CacheService } from '@/common/cache/services/cache.service';

@Injectable()
export class PublicComicsService extends BaseService<Comic, IComicRepository> {
  /** getList cache: đặt 0 hoặc để `cacheForGetList` null (trong constructor) để tắt. */
  protected cacheForGetListTtlSec = 90;

  constructor(
    @Inject(COMIC_REPOSITORY)
    protected readonly comicRepository: IComicRepository,
    @Inject(FOLLOW_REPOSITORY)
    private readonly followRepository: IFollowRepository,
    cacheService: CacheService,
  ) {
    super(comicRepository);
    this.cacheForGetList = cacheService;
  }

  protected override async prepareFilters(filters?: any) {
    const groupId = RequestContext.get<number>('groupId');
    const prepared: any = { ...(filters || {}) };

    if (!prepared.status) {
      prepared.status = { in: PUBLIC_COMIC_STATUSES };
    }

    if (groupId) {
      prepared.group_id = groupId;
    }

    // Map comic_category_id to categoryId (Repo handles categoryId)
    if (prepared.comic_category_id) {
      prepared.categoryId = prepared.comic_category_id;
      delete prepared.comic_category_id;
    }

    return prepared;
  }

  protected override async prepareOptions(options: any = {}) {
    const base = await super.prepareOptions(options);

    // Explicit select to avoid fetching audit fields from DB
    const publicSelect = {
      id: true,
      slug: true,
      title: true,
      description: true,
      cover_image: true,
      author: true,
      status: true,
      created_at: true,
      updated_at: true,
      last_chapter_id: true,
      last_chapter_updated_at: true,
      is_featured: true,
      stats: true,
      categoryLinks: {
        select: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
      chapters: {
        where: { status: 'published' as const },
        orderBy: { chapter_index: 'desc' as const },
        take: 1,
        select: {
          id: true,
          title: true,
          chapter_index: true,
          chapter_label: true,
          created_at: true,
        },
      },
    };

    return {
      ...base,
      select: options?.select ?? publicSelect,
    };
  }

  protected override transform(entity: any): any {
    if (!entity) return null;

    const transformed: any = { ...entity };

    // Map categoryLinks to categories (only if select was used)
    if (transformed.categoryLinks && Array.isArray(transformed.categoryLinks)) {
      transformed.categories = transformed.categoryLinks
        .map((link: any) => link?.category)
        .filter(Boolean);
      delete transformed.categoryLinks;
    }

    // Map chapters array to last_chapter
    if (transformed.chapters && Array.isArray(transformed.chapters)) {
      const lastChapter = transformed.chapters[0];
      if (lastChapter) {
        transformed.last_chapter = {
          id: lastChapter.id,
          title: lastChapter.title,
          chapter_index: lastChapter.chapter_index,
          chapter_label: lastChapter.chapter_label,
          created_at: lastChapter.created_at,
        };
      }
      delete transformed.chapters;
    }

    // Convert BigInts (handled globally)
    return transformed;
  }

  protected override async afterGetOne(entity: any): Promise<any> {
    const transformed = this.transform(entity);
    if (!transformed) return null;

    // Check follow status if user is logged in
    const userId = RequestContext.get<number>('userId');
    if (userId) {
      transformed.is_following = await this.followRepository.exists({
        user_id: userId,
        comic_id: entity.id,
      });
    } else {
      transformed.is_following = false;
    }

    return transformed;
  }

  /**
   * Get comic by slug
   */
  async getBySlug(slug: string) {
    const groupId = RequestContext.get<number>('groupId');
    const filters: any = { slug };
    if (groupId) filters.group_id = groupId;

    const comic = await this.comicRepository.findOne(filters);

    if (!comic) {
      throw new NotFoundException('Comic not found');
    }

    // Một lần query: cùng select với findById(getOne), không gọi findById lại
    const transformed = this.transform(comic) as any;
    const final = await this.afterGetOne(transformed);
    if (!final) {
      throw new NotFoundException('Comic not found');
    }
    return final;
  }

  /**
   * Get chapters by comic slug
   */
  async getChaptersBySlug(slug: string, options: any = {}) {
    const groupId = RequestContext.get<number>('groupId');
    const filters: any = { slug };
    if (groupId) filters.group_id = groupId;

    const comic = await this.comicRepository.findOne(filters);

    if (!comic) {
      throw new NotFoundException('Comic not found');
    }

    // Increment view count khi xem danh sách chapter (tùy logic)
    await this.comicRepository.incrementView(comic.id);

    const finalOptions = {
      ...options,
      limit: 10000,
    };
    return this.comicRepository.getChapters(comic.id, finalOptions);
  }
}

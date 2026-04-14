import { Injectable, Inject } from '@nestjs/common';
import { ComicCategory } from '@prisma/client';
import { BaseService } from '@/common/core/services';
import {
  IComicCategoryRepository,
  COMIC_CATEGORY_REPOSITORY,
} from '../../domain/comic-category.repository';
import {
  verifyGroupOwnership,
  getGroupFilter,
} from '@/common/shared/utils/group-ownership.util';
import { SlugHelper } from '@/common/core/utils/slug.helper';

@Injectable()
export class ComicCategoryService extends BaseService<
  ComicCategory,
  IComicCategoryRepository
> {
  constructor(
    @Inject(COMIC_CATEGORY_REPOSITORY)
    protected readonly comicCategoryRepository: IComicCategoryRepository,
  ) {
    super(comicCategoryRepository);
    this.autoAddGroupId = true;
  }

  protected override async prepareFilters(filters?: any): Promise<any> {
    return { ...(filters || {}), ...getGroupFilter(filters) };
  }

  // ── CRUD Overrides ────────────────────────────────────────────────────────

  override async getOne(id: any): Promise<ComicCategory> {
    const entity = await super.getOne(id);
    verifyGroupOwnership(entity as any);
    return entity;
  }

  // ── Lifecycle Hooks ────────────────────────────────────────────────────────

  protected override async beforeCreate(data: any): Promise<any> {
    const payload = await super.beforeCreate(data);

    // Handle Slug
    if (!payload.slug) {
      payload.slug = await SlugHelper.uniqueSlug(
        payload.name,
        this.comicCategoryRepository,
      );
    }

    return payload;
  }

  protected override async beforeUpdate(id: any, data: any): Promise<any> {
    await this.getOne(id); // Already includes ownership check

    const payload = { ...data };

    // Handle Slug if name or slug is provided
    if (payload.name || payload.slug) {
      payload.slug = await SlugHelper.uniqueSlug(
        payload.slug || payload.name || '',
        this.comicCategoryRepository,
        id,
      );
    }

    return payload;
  }

  protected override async beforeDelete(id: any): Promise<boolean> {
    await this.getOne(id); // Ownership check
    return true;
  }
}

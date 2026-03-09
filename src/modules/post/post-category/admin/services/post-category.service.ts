import { Injectable, Inject } from '@nestjs/common';
import { PostCategory } from '@prisma/client';
import { IPostCategoryRepository, POST_CATEGORY_REPOSITORY } from '@/modules/post/post-category/domain/post-category.repository';
import { BaseContentService } from '@/common/core/services';
import { SlugHelper } from '@/common/core/utils/slug.helper';
import { toBigInt } from '@/common/core/utils/data.helper';

@Injectable()
export class PostCategoryService extends BaseContentService<PostCategory, IPostCategoryRepository> {
  constructor(
    @Inject(POST_CATEGORY_REPOSITORY)
    private readonly categoryRepo: IPostCategoryRepository,
  ) {
    super(categoryRepo);
  }

  async getSimpleList(query: any) {
    return this.getList({
      ...query,
      limit: 1000,
      sort: query.sort ?? 'sort_order:ASC'
    });
  }

  // ── Lifecycle Hooks ────────────────────────────────────────────────────────

  protected override async beforeCreate(data: any) {
    const payload = await super.beforeCreate(data);

    // Handle Slug
    if (!payload.slug) {
      payload.slug = await SlugHelper.uniqueSlug(payload.name, this.categoryRepo);
    }

    payload.parent_id = toBigInt(payload.parent_id);
    return payload;
  }

  protected override async beforeUpdate(id: number | bigint, data: any) {
    const payload = { ...data };

    // Handle Slug
    if (payload.name || payload.slug) {
      payload.slug = await SlugHelper.uniqueSlug(
        payload.slug || payload.name || '',
        this.categoryRepo,
        id
      );
    }

    payload.parent_id = toBigInt(payload.parent_id);
    return payload;
  }

  // ── Transformation ─────────────────────────────────────────────────────────

  protected override transform(category: any) {
    if (!category) return category;
    const item = super.transform(category) as any;

    if (item.parent) {
      const { id, name, slug } = item.parent;
      item.parent = { id, name, slug };
    }

    if (Array.isArray(item.children)) {
      item.children = item.children.map((child: any) => ({
        id: child.id,
        name: child.name,
        slug: child.slug
      }));
    }

    return item;
  }
}

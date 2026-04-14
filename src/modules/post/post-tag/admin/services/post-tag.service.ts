import { Injectable, Inject } from '@nestjs/common';
import { PostTag } from '@prisma/client';
import {
  IPostTagRepository,
  POST_TAG_REPOSITORY,
} from '@/modules/post/post-tag/domain/post-tag.repository';
import { BaseContentService } from '@/common/core/services';
import { SlugHelper } from '@/common/core/utils/slug.helper';

@Injectable()
export class PostTagService extends BaseContentService<
  PostTag,
  IPostTagRepository
> {
  constructor(
    @Inject(POST_TAG_REPOSITORY)
    private readonly tagRepo: IPostTagRepository,
  ) {
    super(tagRepo);
  }

  async getSimpleList(query: any) {
    return this.getList({ ...query, limit: 1000 });
  }

  // ── Lifecycle Hooks ────────────────────────────────────────────────────────

  protected override async beforeCreate(data: any) {
    const payload = await super.beforeCreate(data);

    // Handle Slug
    if (!payload.slug) {
      payload.slug = await SlugHelper.uniqueSlug(payload.name, this.tagRepo);
    }

    return payload;
  }

  protected override async beforeUpdate(id: any, data: any) {
    const payload = { ...data };

    // Handle Slug
    if (payload.name || payload.slug) {
      payload.slug = await SlugHelper.uniqueSlug(
        payload.slug || payload.name || '',
        this.tagRepo,
        id,
      );
    }

    return payload;
  }
}

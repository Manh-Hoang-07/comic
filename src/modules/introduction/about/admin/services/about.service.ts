import { Injectable, Inject } from '@nestjs/common';
import {
  IAboutRepository,
  ABOUT_REPOSITORY,
} from '@/modules/introduction/about/domain/about.repository';
import { BaseContentService } from '@/common/core/services';
import { SlugHelper } from '@/common/core/utils/slug.helper';

@Injectable()
export class AboutService extends BaseContentService<any, IAboutRepository> {
  constructor(
    @Inject(ABOUT_REPOSITORY)
    private readonly aboutRepo: IAboutRepository,
  ) {
    super(aboutRepo);
  }

  protected defaultSort = 'sort_order:asc,created_at:desc';

  // ── Lifecycle Hooks ────────────────────────────────────────────────────────

  protected override async beforeCreate(data: any) {
    const payload = await super.beforeCreate(data);

    // Handle Slug
    if (!payload.slug) {
      payload.slug = await SlugHelper.uniqueSlug(payload.title, this.aboutRepo);
    }

    return payload;
  }

  protected override async beforeUpdate(id: any, data: any) {
    const payload = { ...data };

    // Handle Slug
    if (payload.title || payload.slug) {
      payload.slug = await SlugHelper.uniqueSlug(
        payload.slug || payload.title || '',
        this.aboutRepo,
        id,
      );
    }

    return payload;
  }
}

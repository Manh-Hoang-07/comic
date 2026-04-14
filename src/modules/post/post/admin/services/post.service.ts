import { Inject, Injectable } from '@nestjs/common';
import { Post } from '@prisma/client';
import { verifyGroupOwnership } from '@/common/shared/utils';
import {
  IPostRepository,
  POST_REPOSITORY,
} from '@/modules/post/post/domain/post.repository';
import { BaseContentService } from '@/common/core/services';
import { SlugHelper } from '@/common/core/utils/slug.helper';
import { toPrimaryKey } from '@/common/core/utils/primary-key.util';
import { normalizeDate } from '@/common/core/utils/data.helper';
import { PostActionService } from './post-action.service';

@Injectable()
export class PostService extends BaseContentService<Post, IPostRepository> {
  constructor(
    @Inject(POST_REPOSITORY)
    private readonly postRepo: IPostRepository,
    private readonly actionService: PostActionService,
  ) {
    super(postRepo);
    this.autoAddGroupId = true;
  }

  async getSimpleList(query: any) {
    return this.getList({ page: 1, limit: 1000, search: query.search } as any);
  }

  // ── CRUD Overrides ────────────────────────────────────────────────────────

  override async getOne(id: any): Promise<Post> {
    const entity = await super.getOne(id);
    verifyGroupOwnership({ group_id: entity.group_id });
    return entity;
  }

  async create(data: any): Promise<Post> {
    const payload = await this.beforeCreate(data);
    const entity = await this.repository.create(payload);
    await this.actionService.syncRelations(entity.id, data);
    return this.getOne(entity.id);
  }

  async update(id: any, data: any): Promise<Post> {
    const payload = await this.beforeUpdate(id, data);
    const _entity = await this.repository.update(id, payload);
    await this.actionService.syncRelations(id, data);
    return this.getOne(id);
  }

  // ── Lifecycle Hooks ────────────────────────────────────────────────────────

  protected override async beforeCreate(data: any) {
    const payload = await super.beforeCreate(data);

    // Handle Slug
    payload.slug = await SlugHelper.uniqueSlug(payload.title, this.postRepo);

    // Normalize Fields
    payload.primary_postcategory_id = toPrimaryKey(
      payload.primary_postcategory_id,
    );
    payload.published_at = normalizeDate(payload.published_at);
    if (payload.group_id) payload.group_id = toPrimaryKey(payload.group_id);

    // Relations handled in create() override
    delete payload.tag_ids;
    delete payload.category_ids;

    return payload;
  }

  protected override async beforeUpdate(id: any, data: any) {
    const _current = await this.getOne(id); // Includes ownership check

    const payload = { ...data };

    // Handle Slug
    if (payload.title || payload.slug) {
      payload.slug = await SlugHelper.uniqueSlug(
        payload.slug || payload.title || '',
        this.postRepo,
        id,
      );
    }

    payload.primary_postcategory_id = toPrimaryKey(
      payload.primary_postcategory_id,
    );
    payload.published_at = normalizeDate(payload.published_at);

    // Relations handled in update() override
    delete payload.tag_ids;
    delete payload.category_ids;

    return payload;
  }

  // ── Transformation ─────────────────────────────────────────────────────────

  protected override transform(post: any) {
    if (!post) return post;
    const p = { ...post } as any;

    if (p.primary_category) {
      const { id, name, slug } = p.primary_category;
      p.primary_category = { id, name, slug };
    }

    if (p.categories) {
      p.categories = (p.categories as any[])
        .map((link) => link?.category)
        .filter(Boolean)
        .map((cat: any) => ({ id: cat.id, name: cat.name, slug: cat.slug }));
    }

    if (p.tags) {
      p.tags = (p.tags as any[])
        .map((link) => link?.tag)
        .filter(Boolean)
        .map((tag: any) => ({ id: tag.id, name: tag.name, slug: tag.slug }));
    }

    return p;
  }
}

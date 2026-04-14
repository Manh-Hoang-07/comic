import { Injectable, Inject } from '@nestjs/common';
import { Comic } from '@prisma/client';
import { BaseService } from '@/common/core/services';
import {
  IComicRepository,
  COMIC_REPOSITORY,
} from '../../domain/comic.repository';
import { CreateComicDto } from '../dtos/create-comic.dto';
import { UpdateComicDto } from '../dtos/update-comic.dto';
import {
  verifyGroupOwnership,
  getGroupFilter,
} from '@/common/shared/utils/group-ownership.util';
import { SlugHelper } from '@/common/core/utils/slug.helper';
import { ComicActionService } from './comic-action.service';

@Injectable()
export class ComicService extends BaseService<Comic, IComicRepository> {
  constructor(
    @Inject(COMIC_REPOSITORY)
    protected readonly comicRepository: IComicRepository,
    private readonly actionService: ComicActionService,
  ) {
    super(comicRepository);
    this.autoAddGroupId = true;
  }

  protected override async prepareFilters(filters?: any): Promise<any> {
    return { ...(filters || {}), ...getGroupFilter(filters) };
  }

  // ── CRUD Overrides ────────────────────────────────────────────────────────

  override async getOne(id: any): Promise<Comic> {
    const entity = await super.getOne(id);
    verifyGroupOwnership(entity as any);
    return entity;
  }

  async create(data: CreateComicDto): Promise<Comic> {
    const payload = await this.beforeCreate(data);
    const entity = await this.repository.create(payload);
    await this.actionService.syncRelations(entity, data, true);
    return this.getOne(entity.id);
  }

  async update(id: any, data: UpdateComicDto): Promise<Comic> {
    const payload = await this.beforeUpdate(id, data);
    const entity = await this.repository.update(id, payload);
    await this.actionService.syncRelations(entity, data, false);
    return this.getOne(id);
  }

  // ── Lifecycle Hooks ────────────────────────────────────────────────────────

  protected override async beforeCreate(data: CreateComicDto): Promise<any> {
    const payload = await super.beforeCreate(data);

    // Handle Slug
    payload.slug = await SlugHelper.uniqueSlug(
      payload.title,
      this.comicRepository,
    );

    // Relationships handled in create() override
    delete (payload as any).category_ids;
    return payload;
  }

  protected override async beforeUpdate(
    id: any,
    data: UpdateComicDto,
  ): Promise<any> {
    await this.getOne(id); // Already includes ownership check

    const payload = { ...data };

    // Handle Slug if title or slug is provided
    if (payload.title || payload.slug) {
      payload.slug = await SlugHelper.uniqueSlug(
        payload.slug || payload.title || '',
        this.comicRepository,
        id,
      );
    }

    delete (payload as any).category_ids;
    return payload;
  }

  protected override async beforeDelete(id: any): Promise<boolean> {
    await this.getOne(id); // Ownership check
    return true;
  }

  // ── Transformation ─────────────────────────────────────────────────────────

  protected override transform(entity: any): any {
    if (!entity) return null;
    const item = { ...entity };

    // Flatten category links
    if (item.categoryLinks && Array.isArray(item.categoryLinks)) {
      item.categories = item.categoryLinks
        .map((l: any) => l?.category)
        .filter(Boolean);
      item.category_ids = item.categories.map((c: any) => c.id);
      delete item.categoryLinks;
    } else {
      item.categories = item.categories || [];
      item.category_ids = item.category_ids || [];
    }

    return item;
  }
}

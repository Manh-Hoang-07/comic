import { Injectable, Inject } from '@nestjs/common';
import { Chapter } from '@prisma/client';
import { BaseService } from '@/common/core/services';
import {
  IChapterRepository,
  CHAPTER_REPOSITORY,
} from '../../domain/chapter.repository';
import {
  verifyGroupOwnership,
  getGroupFilter,
} from '@/common/shared/utils/group-ownership.util';
import { ChapterActionService } from './chapter-action.service';
import { toPrimaryKey } from '@/common/core/repositories/prisma-query.helper';

@Injectable()
export class ChapterService extends BaseService<Chapter, IChapterRepository> {
  constructor(
    @Inject(CHAPTER_REPOSITORY)
    protected readonly chapterRepository: IChapterRepository,
    private readonly actionService: ChapterActionService,
  ) {
    super(chapterRepository);
    this.autoAddGroupId = true;
  }

  protected override async prepareFilters(filters?: any): Promise<any> {
    return { ...(filters || {}), ...getGroupFilter(filters) };
  }

  // ── Extended Operations ────────────────────────────────────────────────────

  async updatePages(id: any, pages: any[]) {
    await this.getOne(id); // Check exists & ownership
    await this.actionService.syncPages(toPrimaryKey(id), pages);
    return this.getOne(id);
  }

  // ── CRUD Overrides ────────────────────────────────────────────────────────

  override async getOne(id: any): Promise<Chapter> {
    const entity = await super.getOne(id);
    verifyGroupOwnership(entity as any);
    return entity;
  }

  async create(data: any): Promise<Chapter> {
    const payload = await this.beforeCreate(data);
    const entity = await this.repository.create(payload);

    // Side effects
    await this.actionService.syncPages(toPrimaryKey(entity.id), data.pages);
    await this.actionService.handleNotifications(entity);
    await this.actionService.updateComicTimeline(toPrimaryKey(entity.comic_id));

    return this.getOne(entity.id);
  }

  async update(id: any, data: any): Promise<Chapter> {
    const payload = await this.beforeUpdate(id, data);
    const entity = await this.repository.update(id, payload);

    // Side effects
    await this.actionService.handleNotifications(entity);
    await this.actionService.updateComicTimeline(toPrimaryKey(entity.comic_id));

    return this.getOne(id);
  }

  // ── Lifecycle Hooks ────────────────────────────────────────────────────────

  protected override async beforeCreate(data: any): Promise<any> {
    const payload = await super.beforeCreate(data);

    if (payload.comic_id && payload.chapter_index !== undefined) {
      await this.actionService.validateUniqueIndex(
        toPrimaryKey(payload.comic_id),
        payload.chapter_index,
      );
    }

    delete payload.pages;
    return payload;
  }

  protected override async beforeUpdate(id: any, data: any): Promise<any> {
    const entity = await this.getOne(id); // Already includes ownership check
    const payload = { ...data };

    if (
      payload.chapter_index !== undefined &&
      payload.chapter_index !== entity.chapter_index
    ) {
      await this.actionService.validateUniqueIndex(
        toPrimaryKey(entity.comic_id),
        payload.chapter_index,
        toPrimaryKey(id),
      );
    }

    return payload;
  }

  protected override async beforeDelete(id: any): Promise<boolean> {
    await this.getOne(id); // Ownership check
    return true;
  }

  protected override async afterDelete(
    id: any,
    entity: Chapter,
  ): Promise<void> {
    if (entity && entity.comic_id) {
      await this.actionService.updateComicTimeline(
        toPrimaryKey(entity.comic_id),
      );
    }
  }

  // ── Transformation ─────────────────────────────────────────────────────────
}

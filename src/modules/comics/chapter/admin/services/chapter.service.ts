import { Injectable, Inject } from '@nestjs/common';
import { Chapter } from '@prisma/client';
import { BaseService } from '@/common/core/services';
import { IChapterRepository, CHAPTER_REPOSITORY } from '../../domain/chapter.repository';
import { verifyGroupOwnership, getGroupFilter } from '@/common/shared/utils/group-ownership.util';
import { ChapterActionService } from './chapter-action.service';

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
    return { ...(filters || {}), ...getGroupFilter() };
  }

  // ── Extended Operations ────────────────────────────────────────────────────

  async updatePages(id: string | number | bigint, pages: any[]) {
    const chapter = await this.getOne(id); // Check exists & ownership
    await this.actionService.syncPages(BigInt(id), pages);
    return this.getOne(id);
  }

  // ── CRUD Overrides ────────────────────────────────────────────────────────

  override async getOne(id: string | number | bigint): Promise<Chapter> {
    const entity = await super.getOne(id);
    verifyGroupOwnership(entity as any);
    return entity;
  }

  async create(data: any): Promise<Chapter> {
    const payload = await this.beforeCreate(data);
    const entity = await this.repository.create(payload);

    // Side effects
    await this.actionService.syncPages(entity.id as bigint, data.pages);
    await this.actionService.handleNotifications(entity);
    await this.actionService.updateComicTimeline(entity.comic_id as bigint);

    return this.getOne(entity.id);
  }

  async update(id: string | number | bigint, data: any): Promise<Chapter> {
    const payload = await this.beforeUpdate(id, data);
    const entity = await this.repository.update(id, payload);

    // Side effects
    await this.actionService.handleNotifications(entity);
    await this.actionService.updateComicTimeline(entity.comic_id as bigint);

    return this.getOne(id);
  }

  // ── Lifecycle Hooks ────────────────────────────────────────────────────────

  protected override async beforeCreate(data: any): Promise<any> {
    const payload = await super.beforeCreate(data);

    if (payload.comic_id && payload.chapter_index !== undefined) {
      await this.actionService.validateUniqueIndex(BigInt(payload.comic_id), payload.chapter_index);
    }

    delete payload.pages;
    return payload;
  }

  protected override async beforeUpdate(id: string | number | bigint, data: any): Promise<any> {
    const entity = await this.getOne(id); // Already includes ownership check
    const payload = { ...data };

    if (payload.chapter_index !== undefined && payload.chapter_index !== entity.chapter_index) {
      await this.actionService.validateUniqueIndex(entity.comic_id as bigint, payload.chapter_index, BigInt(id));
    }

    return payload;
  }

  protected override async beforeDelete(id: string | number | bigint): Promise<boolean> {
    await this.getOne(id); // Ownership check
    return true;
  }

  protected override async afterDelete(id: string | number | bigint, entity: Chapter): Promise<void> {
    if (entity && entity.comic_id) {
      await this.actionService.updateComicTimeline(entity.comic_id as bigint);
    }
  }

  // ── Transformation ─────────────────────────────────────────────────────────

  protected override transform(entity: any): any {
    return this.deepConvertBigInt(entity);
  }
}

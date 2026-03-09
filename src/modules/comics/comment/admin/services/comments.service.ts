import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ComicComment } from '@prisma/client';
import { BaseService } from '@/common/core/services';
import { ICommentRepository, COMMENT_REPOSITORY } from '../../domain/comment.repository';
import { IPaginationOptions } from '@/common/core/repositories';
import { verifyGroupOwnership, getGroupFilter } from '@/common/shared/utils/group-ownership.util';
import { COMMENT_TREE_INCLUDE, normalizeCommentFilters } from '../utils/comment-query.helper';

@Injectable()
export class CommentsService extends BaseService<ComicComment, ICommentRepository> {
  constructor(
    @Inject(COMMENT_REPOSITORY)
    protected readonly commentRepository: ICommentRepository,
  ) {
    super(commentRepository);
  }

  protected override async prepareFilters(filters: any = {}): Promise<any> {
    const prepared = normalizeCommentFilters(filters);
    return { ...prepared, ...getGroupFilter() };
  }

  protected override async prepareOptions(options: IPaginationOptions): Promise<IPaginationOptions> {
    const normalized = await super.prepareOptions(options);
    (normalized as any).include = COMMENT_TREE_INCLUDE;
    return normalized;
  }

  // ── Extended Operations ────────────────────────────────────────────────────

  async getStatistics() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [total, visible, hidden, todayCount, thisWeekCount, thisMonthCount] = await Promise.all([
      this.repository.count({}),
      this.repository.count({ status: 'visible' }),
      this.repository.count({ status: 'hidden' }),
      this.repository.count({ date_from: today }),
      this.repository.count({ date_from: startOfWeek }),
      this.repository.count({ date_from: startOfMonth }),
    ]);

    return { total, visible, hidden, today: todayCount, this_week: thisWeekCount, this_month: thisMonthCount };
  }

  // ── CRUD Overrides ────────────────────────────────────────────────────────

  override async getOne(id: string | number | bigint): Promise<ComicComment> {
    const entity = await (this.repository as any).delegate.findFirst({
      where: { id: (this.repository as any).toPrimaryKey(id) },
      include: COMMENT_TREE_INCLUDE,
    });

    if (!entity) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }

    if (entity.comic) {
      verifyGroupOwnership(entity.comic as any);
    }

    return this.transform(entity) as ComicComment;
  }

  protected override async beforeUpdate(id: string | number | bigint, data: any): Promise<any> {
    await this.verifyOwnershipAndExistence(id);
    return data;
  }

  protected override async beforeDelete(id: string | number | bigint): Promise<boolean> {
    await this.verifyOwnershipAndExistence(id);
    return true;
  }

  // ── Private Helpers ────────────────────────────────────────────────────────

  private async verifyOwnershipAndExistence(id: string | number | bigint) {
    const comment = await (this.repository as any).delegate.findFirst({
      where: { id: (this.repository as any).toPrimaryKey(id) },
      include: { comic: true },
    });

    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }

    if (comment.comic) {
      verifyGroupOwnership(comment.comic as any);
    }
  }

  protected override transform(entity: any): any {
    return this.deepConvertBigInt(entity);
  }
}

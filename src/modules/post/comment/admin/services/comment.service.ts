import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PostComment } from '@prisma/client';
import {
  IPostCommentRepository,
  POST_COMMENT_REPOSITORY,
} from '@/modules/post/comment/domain/post-comment.repository';
import { BaseContentService } from '@/common/core/services';
import {
  POST_COMMENT_TREE_INCLUDE,
  normalizePostCommentFilters,
} from '../../utils/post-comment-query.helper';

@Injectable()
export class AdminPostCommentService extends BaseContentService<
  PostComment,
  IPostCommentRepository
> {
  constructor(
    @Inject(POST_COMMENT_REPOSITORY)
    private readonly commentRepo: IPostCommentRepository,
  ) {
    super(commentRepo);
  }

  protected override async prepareFilters(filters: any = {}): Promise<any> {
    const prepared = normalizePostCommentFilters(filters);

    // Default to root comments if parentId is not specified
    if (prepared.parentId === undefined) {
      prepared.parentId = null;
    }

    return prepared;
  }

  protected override async prepareOptions(options: any = {}) {
    const base = await super.prepareOptions(options);
    return {
      ...base,
      include: options?.include ?? POST_COMMENT_TREE_INCLUDE,
    };
  }

  override async getOne(id: any): Promise<PostComment> {
    const entity = await (this.repository as any).delegate.findFirst({
      where: { id: (this.repository as any).toPrimaryKey(id) },
      include: POST_COMMENT_TREE_INCLUDE,
    });

    if (!entity) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }

    return this.transform(entity) as PostComment;
  }

  async getStatistics() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [total, visible, hidden, todayCount, thisWeekCount, thisMonthCount] =
      await Promise.all([
        this.repository.count({}),
        this.repository.count({ status: 'visible' }),
        this.repository.count({ status: 'hidden' }),
        this.repository.count({ startDate: today }),
        this.repository.count({ startDate: startOfWeek }),
        this.repository.count({ startDate: startOfMonth }),
      ]);

    return {
      total,
      visible,
      hidden,
      today: todayCount,
      this_week: thisWeekCount,
      this_month: thisMonthCount,
    };
  }
}

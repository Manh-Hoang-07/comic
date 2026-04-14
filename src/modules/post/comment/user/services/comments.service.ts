import {
  Injectable,
  Inject,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PostComment } from '@prisma/client';
import { BaseService } from '@/common/core/services';
import {
  IPostCommentRepository,
  POST_COMMENT_REPOSITORY,
} from '../../domain/post-comment.repository';
import { PostNotificationService } from '@/modules/post/shared/services/post-notification.service';
import { getCurrentUserId } from '@/common/auth/utils/auth-context.helper';
import {
  POST_COMMENT_TREE_INCLUDE,
  normalizePostCommentFilters,
} from '../../utils/post-comment-query.helper';
import { toPrimaryKey } from '@/common/core/repositories/prisma-query.helper';

@Injectable()
export class UserPostCommentsService extends BaseService<
  PostComment,
  IPostCommentRepository
> {
  constructor(
    @Inject(POST_COMMENT_REPOSITORY)
    protected readonly commentRepository: IPostCommentRepository,
    private readonly notificationService: PostNotificationService,
  ) {
    super(commentRepository);
  }

  protected override async prepareFilters(filters: any = {}) {
    const userId = getCurrentUserId();
    const prepared = normalizePostCommentFilters(filters);

    if (filters.by_current_user) {
      prepared.userId = userId;
    }

    return prepared;
  }

  protected override async prepareOptions(options: any = {}) {
    const base = await super.prepareOptions(options);
    return {
      ...base,
      include: options?.include ?? POST_COMMENT_TREE_INCLUDE,
      sort: options?.sort ?? 'created_at:desc',
    };
  }

  // ── Extended Operations ────────────────────────────────────────────────────

  async updateComment(id: any, content: string) {
    const userId = getCurrentUserId();
    if (!userId) throw new UnauthorizedException();

    const comment = await this.repository.findOne({
      id,
      userId: toPrimaryKey(userId),
    });
    if (!comment) throw new NotFoundException('Comment not found');

    return this.update(id, { content, updated_user_id: userId });
  }

  async removeComment(id: any) {
    const userId = getCurrentUserId();
    if (!userId) throw new UnauthorizedException();

    const comment = await this.repository.findOne({
      id,
      userId: toPrimaryKey(userId),
    });
    if (!comment) throw new NotFoundException('Comment not found');

    return this.repository.delete(id);
  }

  // ── Lifecycle Hooks ────────────────────────────────────────────────────────

  protected override async beforeCreate(data: any): Promise<any> {
    const userId = getCurrentUserId();
    if (!userId) throw new UnauthorizedException();

    const payload = { ...data };
    payload.user_id = userId;
    payload.status = 'visible';

    // Validate parent
    if (payload.parent_id) {
      const parent = await this.repository.findById(payload.parent_id);
      if (!parent) throw new NotFoundException('Parent comment not found');
      if (String(parent.post_id) !== String(payload.post_id)) {
        throw new BadRequestException(
          'Parent comment must be from the same post',
        );
      }
    }

    return payload;
  }

  protected override async afterCreate(entity: PostComment): Promise<void> {
    if (entity.parent_id) {
      await this.notificationService.notifyCommentReply(
        entity.id,
        entity.parent_id,
        entity.user_id,
      );
    }
  }
}

import {
  Injectable,
  Inject,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ComicComment } from '@prisma/client';
import { BaseService } from '@/common/core/services';
import {
  ICommentRepository,
  COMMENT_REPOSITORY,
} from '../../domain/comment.repository';
import { ComicNotificationService } from '@/modules/comics/shared/services/comic-notification.service';
import { getCurrentUserId } from '@/common/auth/utils/auth-context.helper';
import { COMMENT_TREE_INCLUDE } from '../../utils/comment-query.helper';

@Injectable()
export class UserCommentsService extends BaseService<
  ComicComment,
  ICommentRepository
> {
  constructor(
    @Inject(COMMENT_REPOSITORY)
    protected readonly commentRepository: ICommentRepository,
    private readonly notificationService: ComicNotificationService,
  ) {
    super(commentRepository);
  }

  protected override async prepareFilters(filters: any = {}) {
    const userId = getCurrentUserId();
    const prepared: any = { ...filters };

    if (prepared.by_current_user) {
      prepared.user_id = userId;
      delete prepared.by_current_user;
    }

    return prepared;
  }

  protected override async prepareOptions(options: any = {}) {
    const base = await super.prepareOptions(options);
    return {
      ...base,
      include: options?.include ?? COMMENT_TREE_INCLUDE,
      sort: options?.sort ?? 'created_at:desc',
    };
  }

  // ── Extended Operations ────────────────────────────────────────────────────

  async updateComment(id: any, content: string) {
    const userId = getCurrentUserId();
    if (!userId) throw new UnauthorizedException();

    const comment = await this.repository.findOne({ id, user_id: userId });
    if (!comment) throw new NotFoundException('Comment not found');

    return this.update(id, { content, updated_user_id: userId });
  }

  async removeComment(id: any) {
    const userId = getCurrentUserId();
    if (!userId) throw new UnauthorizedException();

    const comment = await this.repository.findOne({ id, user_id: userId });
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
      if (String(parent.comic_id) !== String(payload.comic_id)) {
        throw new BadRequestException(
          'Parent comment must be from the same comic',
        );
      }
    }

    return payload;
  }

  protected override async afterCreate(entity: ComicComment): Promise<void> {
    if (entity.parent_id) {
      await this.notificationService.notifyCommentReply(
        entity.id,
        entity.parent_id,
        entity.user_id,
      );
    }
  }
}

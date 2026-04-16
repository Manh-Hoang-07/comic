import { Injectable, Inject } from '@nestjs/common';
import { NotificationType } from '@/shared/enums/types/notification-type.enum';
import {
  IPostCommentRepository,
  POST_COMMENT_REPOSITORY,
} from '../../comment/domain/post-comment.repository';
import {
  INotificationRepository,
  NOTIFICATION_REPOSITORY,
} from '@/modules/system/notification/domain/notification.repository';
import { toPrimaryKey } from '@/common/core/repositories/prisma-query.helper';

@Injectable()
export class PostNotificationService {
  constructor(
    @Inject(POST_COMMENT_REPOSITORY)
    private readonly commentRepository: IPostCommentRepository,
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notificationRepository: INotificationRepository,
  ) {}

  /**
   * Notify user khi có comment reply
   */
  async notifyCommentReply(commentId: any, parentCommentId: any, userId: any) {
    // Lấy parent comment để biết user cần notify qua repository
    const parentComment =
      await this.commentRepository.findById(parentCommentId);

    if (!parentComment || String(parentComment.user_id) === String(userId)) {
      return; // Không notify chính mình
    }

    const notification = await this.notificationRepository.create({
      user_id: toPrimaryKey(parentComment.user_id),
      title: 'Có người trả lời bình luận bài viết của bạn',
      message: 'Bạn có một phản hồi mới cho bình luận bài viết của bạn',
      type: NotificationType.info as any,
      data: {
        comment_id: commentId,
        parent_comment_id: parentCommentId,
        post_id: toPrimaryKey(parentComment.post_id),
      } as any,
      is_read: false,
    } as any);

    return notification;
  }
}

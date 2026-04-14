import { PostComment } from '@prisma/client';
import { IRepository } from '@/common/core/repositories';

export const POST_COMMENT_REPOSITORY = 'IPostCommentRepository';

export interface PostCommentFilter {
  postId?: any;
  userId?: any;
  status?: string;
  parentId?: any | null;
  search?: string;
  startDate?: Date | string;
  endDate?: Date | string;
}

export interface IPostCommentRepository extends IRepository<PostComment> {
  findWithReplies(postId: any): Promise<PostComment[]>;
  updateStatus(id: any, status: string): Promise<PostComment>;
}

import { ComicComment } from '@prisma/client';
import { IRepository } from '@/common/core/repositories';

export const COMMENT_REPOSITORY = 'ICommentRepository';

export interface CommentFilter {
  user_id?: any;
  comic_id?: any;
  chapter_id?: any;
  parent_id?: any;
  status?: string;
  group_id?: any;
}

export type ICommentRepository = IRepository<ComicComment>;

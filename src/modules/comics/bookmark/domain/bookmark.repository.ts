import { Bookmark } from '@prisma/client';
import { IRepository } from '@/common/core/repositories';

export const BOOKMARK_REPOSITORY = 'IBookmarkRepository';

export interface BookmarkFilter {
  user_id?: any;
  comic_id?: any;
  chapter_id?: any;
}

export type IBookmarkRepository = IRepository<Bookmark>;

import { ComicView } from '@prisma/client';
import { IRepository } from '@/common/core/repositories';

export const COMIC_VIEW_REPOSITORY = 'IComicViewRepository';

export interface ComicViewFilter {
  comic_id?: any;
  chapter_id?: any;
  user_id?: any;
  date_from?: Date;
  date_to?: Date;
  group_id?: any;
}

export type IComicViewRepository = IRepository<ComicView>;

import { ComicFollow } from '@prisma/client';
import { IRepository } from '@/common/core/repositories';

export const FOLLOW_REPOSITORY = 'IFollowRepository';

export interface FollowFilter {
  user_id?: any;
  comic_id?: any;
}

export interface IFollowRepository extends IRepository<ComicFollow> {
  syncFollowCount(comicId: any): Promise<void>;
}

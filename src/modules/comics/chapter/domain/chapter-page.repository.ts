import { ChapterPage } from '@prisma/client';
import { IRepository } from '@/common/core/repositories';

export const CHAPTER_PAGE_REPOSITORY = 'IChapterPageRepository';

export interface ChapterPageFilter {
  chapter_id?: any;
}

export interface IChapterPageRepository extends IRepository<ChapterPage> {
  createMany(data: any[]): Promise<void>;
}

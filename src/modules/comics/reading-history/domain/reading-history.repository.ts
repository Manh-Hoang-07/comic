import { ReadingHistory } from '@prisma/client';
import { IRepository } from '@/common/core/repositories';

export const READING_HISTORY_REPOSITORY = 'IReadingHistoryRepository';

export interface ReadingHistoryFilter {
  user_id?: any;
  comic_id?: any;
}

export type IReadingHistoryRepository = IRepository<ReadingHistory>;

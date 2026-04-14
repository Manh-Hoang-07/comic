import { Comic } from '@prisma/client';
import { IRepository } from '@/common/core/repositories';

export const COMIC_REPOSITORY = 'IComicRepository';

export interface ComicFilter {
  slug?: string;
  status?: string;
  author?: string;
  search?: string;
  categoryId?: any;
  excludeId?: any;
  created_user_id?: any;
  group_id?: any;
  is_featured?: boolean;
}

export interface IComicRepository extends IRepository<Comic> {
  findBySlug(slug: string): Promise<Comic | null>;
  syncCategories(comicId: any, categoryIds: any[]): Promise<void>;
  incrementView(comicId: any): Promise<void>;
  batchIncrementView(comicId: any, count: number): Promise<void>;
  getChapters(id: any, options?: any): Promise<any>;
}

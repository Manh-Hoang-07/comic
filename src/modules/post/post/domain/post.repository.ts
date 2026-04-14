import { Post } from '@prisma/client';
import { IRepository } from '@/common/core/repositories';

export const POST_REPOSITORY = 'IPostRepository';

export interface PostFilter {
  status?: 'published' | 'draft' | 'scheduled' | 'hidden';
  search?: string;
  categorySlug?: string;
  tagSlug?: string;
  categoryId?: number;
  tagId?: number;
  isFeatured?: boolean;
  isPinned?: boolean;
}

export interface IPostRepository extends IRepository<Post> {
  incrementViewCount(id: any): Promise<void>;
  findPublishedBySlug(slug: string): Promise<Post | null>;
  findBySlug(slug: string): Promise<Post | null>;

  // Admin specific methods
  syncRelations(
    postId: any,
    tagIds?: any[],
    categoryIds?: any[],
  ): Promise<void>;
}

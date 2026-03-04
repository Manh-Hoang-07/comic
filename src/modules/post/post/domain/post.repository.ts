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
    incrementViewCount(id: number | bigint): Promise<void>;
    findPublishedBySlug(slug: string): Promise<Post | null>;

    // Admin specific methods
    syncRelations(postId: number | bigint, tagIds?: number[], categoryIds?: number[]): Promise<void>;
}




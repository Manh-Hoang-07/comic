import { Injectable, Inject } from '@nestjs/common';
import { Post } from '@prisma/client';
import { IPostRepository, POST_REPOSITORY } from '../../domain/post.repository';
import { normalizeIdArray } from '@/common/core/utils/data.helper';

@Injectable()
export class PostActionService {
    constructor(
        @Inject(POST_REPOSITORY)
        private readonly postRepo: IPostRepository,
    ) { }

    /**
     * Syncs tags and categories for a post.
     */
    async syncRelations(postId: number | bigint, data: { tag_ids?: any; category_ids?: any }): Promise<void> {
        const tagIds = normalizeIdArray(data.tag_ids);
        const categoryIds = normalizeIdArray(data.category_ids);

        if (tagIds !== null || categoryIds !== null) {
            await this.postRepo.syncRelations(
                Number(postId),
                tagIds || undefined,
                categoryIds || undefined
            );
        }
    }
}

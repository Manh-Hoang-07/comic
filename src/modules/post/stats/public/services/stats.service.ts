import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IPostRepository, POST_REPOSITORY } from '@/modules/post/post/domain/post.repository';
import { IPostStatsRepository, POST_STATS_REPOSITORY } from '../../domain/post-stats.repository';

@Injectable()
export class PostStatsService {
  constructor(
    @Inject(POST_REPOSITORY)
    private readonly postRepository: IPostRepository,
    @Inject(POST_STATS_REPOSITORY)
    private readonly statsRepository: IPostStatsRepository,
  ) { }

  async getPostStats(postId: number) {
    const post = await this.postRepository.findById(postId);
    if (!post) throw new NotFoundException('Post not found');

    const stats = await this.statsRepository.findById(postId);

    return {
      post_id: postId,
      view_count: Number((stats as any)?.view_count || 0n),
    };
  }
}


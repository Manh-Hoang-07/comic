import { Module } from '@nestjs/common';
import { POST_STATS_REPOSITORY } from './domain/post-stats.repository';
import { PostStatsRepositoryImpl } from './infrastructure/repositories/post-stats.repository.impl';

@Module({
  providers: [
    {
      provide: POST_STATS_REPOSITORY,
      useClass: PostStatsRepositoryImpl,
    },
  ],
  exports: [POST_STATS_REPOSITORY],
})
export class PostStatsRepositoryModule { }


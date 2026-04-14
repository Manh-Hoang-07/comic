import { Module } from '@nestjs/common';
import { PostRepositoryModule } from '@/modules/post/post.repository.module';
import { PostStatsRepositoryModule } from '../stats.repository.module';
import { PublicPostStatsController } from './controllers/stats.controller';
import { PostStatsService } from './services/stats.service';

@Module({
  imports: [PostRepositoryModule, PostStatsRepositoryModule],
  controllers: [PublicPostStatsController],
  providers: [PostStatsService],
  exports: [PostStatsService],
})
export class PublicPostStatsModule {}

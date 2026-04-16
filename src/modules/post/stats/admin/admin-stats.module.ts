import { Module } from '@nestjs/common';
import { RbacModule } from '@/modules/system/rbac/rbac.module';
import { PostRepositoryModule } from '@/modules/post/post.repository.module';
import { PostStatsRepositoryModule } from '../stats.repository.module';
import { AdminPostStatsController } from './controllers/admin-stats.controller';
import { AdminPostStatsService } from './services/admin-stats.service';

@Module({
  imports: [RbacModule, PostRepositoryModule, PostStatsRepositoryModule],
  controllers: [AdminPostStatsController],
  providers: [AdminPostStatsService],
  exports: [AdminPostStatsService],
})
export class AdminPostStatsModule {}

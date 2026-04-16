import { Module } from '@nestjs/common';
import { PostController } from '@/modules/post/post/admin/controllers/post.controller';
import { PostService } from '@/modules/post/post/admin/services/post.service';
import { PostActionService } from '@/modules/post/post/admin/services/post-action.service';
import { PostRepositoryModule } from '@/modules/post/post.repository.module';
import { RbacModule } from '@/modules/system/rbac/rbac.module';

@Module({
  imports: [RbacModule, PostRepositoryModule],
  controllers: [PostController],
  providers: [PostService, PostActionService],
  exports: [PostService, PostActionService],
})
export class AdminPostModule {}

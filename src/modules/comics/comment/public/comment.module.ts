import { Module } from '@nestjs/common';
import { PublicCommentsController } from './controllers/comments.controller';
import { PublicCommentsService } from './services/comments.service';
import { RbacModule } from '@/modules/system/rbac/rbac.module';
import { CommentRepositoryModule } from '../comment.repository.module';

@Module({
  imports: [RbacModule, CommentRepositoryModule],
  controllers: [PublicCommentsController],
  providers: [PublicCommentsService],
  exports: [PublicCommentsService],
})
export class PublicCommentsModule {}

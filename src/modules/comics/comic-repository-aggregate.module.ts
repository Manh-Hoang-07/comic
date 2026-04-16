import { Module } from '@nestjs/common';
import { ComicRepositoryModule } from '@/modules/comics/comic/comic.repository.module';
import { CommentRepositoryModule } from '@/modules/comics/comment/comment.repository.module';
import { FollowRepositoryModule } from '@/modules/comics/follow/follow.repository.module';
import { NotificationRepositoryModule } from '@/modules/system/notification/notification.repository.module';

@Module({
  imports: [
    ComicRepositoryModule,
    CommentRepositoryModule,
    FollowRepositoryModule,
    NotificationRepositoryModule,
  ],
  exports: [
    ComicRepositoryModule,
    CommentRepositoryModule,
    FollowRepositoryModule,
    NotificationRepositoryModule,
  ],
})
export class ComicRepositoryAggregateModule {}

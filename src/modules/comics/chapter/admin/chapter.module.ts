import { Module } from '@nestjs/common';
import { ChapterController } from './controllers/chapter.controller';
import { ChapterService } from './services/chapter.service';
import { ChapterActionService } from './services/chapter-action.service';
import { RbacModule } from '@/modules/system/rbac/rbac.module';
import { FileUploadModule } from '@/modules/storage/file-upload/file-upload.module';
import { ComicNotificationService } from '@/modules/comics/shared/services/comic-notification.service';
import { ChapterRepositoryModule } from '../chapter.repository.module';
import { ComicRepositoryModule } from '../../comic/comic.repository.module';
import { FollowRepositoryModule } from '../../follow/follow.repository.module';
import { CommentRepositoryModule } from '../../comment/comment.repository.module';
import { NotificationRepositoryModule } from '@/modules/system/notification/notification.repository.module';

@Module({
  imports: [
    RbacModule,
    FileUploadModule,
    ChapterRepositoryModule,
    ComicRepositoryModule,
    FollowRepositoryModule,
    CommentRepositoryModule,
    NotificationRepositoryModule,
  ],
  controllers: [ChapterController],
  providers: [ChapterService, ChapterActionService, ComicNotificationService],
  exports: [ChapterService, ChapterActionService, ComicNotificationService],
})
export class AdminChapterModule {}

import { Module } from '@nestjs/common';
import { ComicAdminAggregateModule } from '@/modules/comics/comic-admin-aggregate.module';
import { ComicPublicAggregateModule } from '@/modules/comics/comic-public-aggregate.module';
import { ComicUserAggregateModule } from '@/modules/comics/comic-user-aggregate.module';
import { ComicRepositoryAggregateModule } from '@/modules/comics/comic-repository-aggregate.module';
import { ComicNotificationService } from '@/modules/comics/shared/services/comic-notification.service';
import { ComicViewCronService } from '@/modules/comics/cron/comic-view-cron.service';

@Module({
  imports: [
    ComicRepositoryAggregateModule,
    ComicAdminAggregateModule,
    ComicPublicAggregateModule,
    ComicUserAggregateModule,
  ],
  providers: [ComicNotificationService, ComicViewCronService],
  exports: [ComicNotificationService],
})
export class ComicsModule {}

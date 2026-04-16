import { Module } from '@nestjs/common';
import { UserCommentsModule } from '@/modules/comics/comment/user/comment.module';
import { UserReviewsModule } from '@/modules/comics/review/user/review.module';
import { UserStatsModule } from '@/modules/comics/stats/user/user-stats.module';
import { UserReadingHistoryModule } from '@/modules/comics/reading-history/user/reading-history.module';
import { UserBookmarksModule } from '@/modules/comics/bookmark/user/bookmark.module';
import { UserFollowsModule } from '@/modules/comics/follow/user/follow.module';

@Module({
  imports: [
    UserCommentsModule,
    UserReviewsModule,
    UserStatsModule,
    UserReadingHistoryModule,
    UserBookmarksModule,
    UserFollowsModule,
  ],
  exports: [
    UserCommentsModule,
    UserReviewsModule,
    UserStatsModule,
    UserReadingHistoryModule,
    UserBookmarksModule,
    UserFollowsModule,
  ],
})
export class ComicUserAggregateModule {}

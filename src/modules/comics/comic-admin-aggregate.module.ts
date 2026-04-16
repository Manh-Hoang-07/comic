import { Module } from '@nestjs/common';
import { AdminComicModule } from '@/modules/comics/comic/admin/comic.module';
import { AdminComicCategoryModule } from '@/modules/comics/comic-category/admin/comic-category.module';
import { AdminChapterModule } from '@/modules/comics/chapter/admin/chapter.module';
import { AdminCommentsModule } from '@/modules/comics/comment/admin/comment.module';
import { AdminReviewsModule } from '@/modules/comics/review/admin/review.module';
import { AdminStatsModule } from '@/modules/comics/stats/admin/admin-stats.module';

@Module({
  imports: [
    AdminComicModule,
    AdminComicCategoryModule,
    AdminChapterModule,
    AdminCommentsModule,
    AdminReviewsModule,
    AdminStatsModule,
  ],
  exports: [
    AdminComicModule,
    AdminComicCategoryModule,
    AdminChapterModule,
    AdminCommentsModule,
    AdminReviewsModule,
    AdminStatsModule,
  ],
})
export class ComicAdminAggregateModule {}

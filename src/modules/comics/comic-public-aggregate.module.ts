import { Module } from '@nestjs/common';
import { PublicComicsModule } from '@/modules/comics/comic/public/comic.module';
import { PublicComicCategoriesModule } from '@/modules/comics/comic-category/public/comic-category.module';
import { PublicChaptersModule } from '@/modules/comics/chapter/public/chapter.module';
import { PublicCommentsModule } from '@/modules/comics/comment/public/comment.module';
import { PublicReviewsModule } from '@/modules/comics/review/public/review.module';
import { PublicStatsModule } from '@/modules/comics/stats/public/public-stats.module';
import { HomepageModule } from '@/modules/homepage/homepage.module';

@Module({
  imports: [
    PublicComicsModule,
    PublicComicCategoriesModule,
    PublicChaptersModule,
    PublicCommentsModule,
    PublicReviewsModule,
    PublicStatsModule,
    HomepageModule,
  ],
  exports: [
    PublicComicsModule,
    PublicComicCategoriesModule,
    PublicChaptersModule,
    PublicCommentsModule,
    PublicReviewsModule,
    PublicStatsModule,
    HomepageModule,
  ],
})
export class ComicPublicAggregateModule {}

import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { PublicReviewsService } from '../services/reviews.service';
import { Permission } from '@/common/auth/decorators/rbac.decorators';

@Controller('public/comic-reviews')
export class PublicReviewsController {
  constructor(private readonly reviewsService: PublicReviewsService) {}

  @Permission('public')
  @Get('comics/:comicId')
  async getByComic(
    @Param('comicId') comicId: any,
    @Query('page', new ParseIntPipe({ optional: true })) page: any = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: any = 20,
  ) {
    return this.reviewsService.getByComic(comicId, page, limit);
  }
}

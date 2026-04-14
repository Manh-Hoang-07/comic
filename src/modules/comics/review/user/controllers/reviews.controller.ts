import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ReviewsService } from '../services/reviews.service';
import { Permission } from '@/common/auth/decorators/rbac.decorators';
import { SanitizeHtmlPipe } from '@/modules/comics/shared/pipes/sanitize-html.pipe';

@Controller('user/comic-reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Permission('user')
  @Get()
  async getMyReviews() {
    return this.reviewsService.getList({ by_current_user: true });
  }

  @Permission('user')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 reviews per minute
  @Post('comics/:comicId')
  @UsePipes(new SanitizeHtmlPipe())
  async createOrUpdate(
    @Param('comicId') comicId: any,
    @Body(ValidationPipe) body: { rating: any; content?: string },
  ) {
    return this.reviewsService.createOrUpdateReview(
      comicId,
      body.rating,
      body.content,
    );
  }

  @Permission('user')
  @Delete('comics/:comicId')
  async delete(@Param('comicId') comicId: any) {
    return this.reviewsService.removeReview(comicId);
  }
}

import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  ValidationPipe,
  Req,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { PublicChaptersService } from '@/modules/comics/chapter/public/services/chapter.service';
import { ViewTrackingService } from '@/modules/comics/shared/services/view-tracking.service';
import { Permission } from '@/common/auth/decorators/rbac.decorators';
import { toPrimaryKey } from '@/common/core/repositories/prisma-query.helper';

@Controller('public/chapters')
export class PublicChaptersController {
  constructor(
    private readonly chaptersService: PublicChaptersService,
    private readonly viewTrackingService: ViewTrackingService,
  ) {}

  @Permission('public')
  @Get()
  async getList(@Query(ValidationPipe) query: any) {
    return this.chaptersService.getList(query);
  }

  @Permission('public')
  @Get(':id')
  async getOne(@Param('id') id: any) {
    return this.chaptersService.getOne(id);
  }

  @Permission('public')
  @Get(':id/pages')
  async getPages(@Param('id') id: any) {
    return this.chaptersService.getPages(id);
  }

  @Permission('public')
  @Get(':id/next')
  async getNext(@Param('id') id: any) {
    return this.chaptersService.getNext(id);
  }

  @Permission('public')
  @Get(':id/prev')
  async getPrev(@Param('id') id: any) {
    return this.chaptersService.getPrev(id);
  }

  @Permission('public')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 views per minute per IP
  @Post(':id/view')
  async trackView(@Param('id') id: any, @Req() req: any) {
    const chapter = await this.chaptersService.getOne(id);
    if (!chapter) {
      return { tracked: false };
    }

    return this.viewTrackingService.trackView({
      comic_id: toPrimaryKey(chapter.comic_id),
      chapter_id: id,
      user_id: req.user?.id,
      ip: req.ip,
      user_agent: req.headers['user-agent'],
    });
  }
}

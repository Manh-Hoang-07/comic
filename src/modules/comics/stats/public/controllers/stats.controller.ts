import { Controller, Get, Param } from '@nestjs/common';
import { StatsService } from '../services/stats.service';
import { Permission } from '@/common/auth/decorators/rbac.decorators';

@Controller('public/stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Permission('public')
  @Get('comics/:comicId')
  async getComicStats(@Param('comicId') comicId: any) {
    return this.statsService.getComicStats(comicId);
  }
}

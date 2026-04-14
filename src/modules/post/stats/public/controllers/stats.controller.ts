import { Controller, Get, Param } from '@nestjs/common';
import { Permission } from '@/common/auth/decorators';
import { PostStatsService } from '../services/stats.service';

@Controller('public/posts')
export class PublicPostStatsController {
  constructor(private readonly statsService: PostStatsService) {}

  @Permission('public')
  @Get(':id/stats')
  async getPostStats(@Param('id') id: any) {
    return this.statsService.getPostStats(id);
  }
}

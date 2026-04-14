import { Controller, Get, Param, Query } from '@nestjs/common';
import { Permission } from '@/common/auth/decorators';
import { AdminPostStatsService } from '../services/admin-stats.service';

@Controller('admin/posts')
export class AdminPostStatsController {
  constructor(private readonly statsService: AdminPostStatsService) {}

  @Permission('post.manage')
  @Get(':id/stats')
  async getPostStats(
    @Param('id') id: any,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    const end = endDate || new Date().toISOString().split('T')[0];
    const start =
      startDate ||
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
    return this.statsService.getPostViews(id, new Date(start), new Date(end));
  }

  @Permission('post.manage')
  @Get('statistics/overview')
  async getStatisticsOverview() {
    return this.statsService.getStatisticsOverview();
  }

  @Permission('post.manage')
  @Get('statistics/views')
  async getViewsOverTime(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.statsService.getViewsOverTime(
      new Date(startDate),
      new Date(endDate),
    );
  }
}

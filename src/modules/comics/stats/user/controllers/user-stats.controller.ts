import { Controller, Get, Query, ParseIntPipe } from '@nestjs/common';
import { UserStatsService } from '../services/user-stats.service';
import { Permission } from '@/common/auth/decorators/rbac.decorators';

@Controller('user/stats')
export class UserStatsController {
  constructor(private readonly dashboardService: UserStatsService) {}

  @Permission('user')
  @Get()
  async getDashboard() {
    const userId = 1; // TODO: Get from request context
    return this.dashboardService.getDashboard(userId);
  }

  @Permission('user')
  @Get('library')
  async getLibrary(
    @Query('page', new ParseIntPipe({ optional: true })) page: any = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: any = 20,
  ) {
    const userId = 1; // TODO: Get from request context
    return this.dashboardService.getLibrary(userId, page, limit);
  }
}

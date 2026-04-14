import { Test, TestingModule } from '@nestjs/testing';
import { AdminPostStatsController } from '@/modules/post/stats/admin/controllers/admin-stats.controller';
import { AdminPostStatsService } from '@/modules/post/stats/admin/services/admin-stats.service';

describe('AdminPostStatsController', () => {
  let controller: AdminPostStatsController;
  let service: any;

  beforeEach(async () => {
    service = {
      getPostViews: jest.fn(),
      getStatisticsOverview: jest.fn(),
      getViewsOverTime: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminPostStatsController],
      providers: [
        {
          provide: AdminPostStatsService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<AdminPostStatsController>(AdminPostStatsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call getPostStats', async () => {
    await controller.getPostStats(1, '2023-01-01', '2023-01-31');
    expect(service.getPostViews).toHaveBeenCalled();
  });

  it('should call getStatisticsOverview', async () => {
    await controller.getStatisticsOverview();
    expect(service.getStatisticsOverview).toHaveBeenCalled();
  });

  it('should call getViewsOverTime', async () => {
    await controller.getViewsOverTime('2023-01-01', '2023-01-31');
    expect(service.getViewsOverTime).toHaveBeenCalled();
  });
});

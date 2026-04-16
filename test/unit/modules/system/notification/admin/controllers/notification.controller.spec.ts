import { Test, TestingModule } from '@nestjs/testing';
import { NotificationController } from '@/modules/system/notification/admin/controllers/notification.controller';
import { NotificationService } from '@/modules/system/notification/admin/services/notification.service';

describe('Admin NotificationController', () => {
  let controller: NotificationController;
  let service: any;

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      getList: jest.fn(),
      getSimpleList: jest.fn(),
      getOne: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [{ provide: NotificationService, useValue: service }],
    }).compile();

    controller = module.get<NotificationController>(NotificationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call service.create', async () => {
      const dto = { title: 'Test' };
      await controller.create(dto as any);
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });
});

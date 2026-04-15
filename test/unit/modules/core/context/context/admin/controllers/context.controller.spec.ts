import { Test, TestingModule } from '@nestjs/testing';
import { AdminContextController } from '@/modules/core/context/context/admin/controllers/context.controller';
import { AdminContextService } from '@/modules/core/context/context/admin/services/context.service';
import { Auth } from '@/common/auth/utils';
import { ForbiddenException } from '@nestjs/common';

describe('AdminContextController', () => {
  let controller: AdminContextController;
  let service: any;

  beforeEach(async () => {
    service = {
      createContext: jest.fn(),
      getList: jest.fn(),
      findById: jest.fn(),
      updateContext: jest.fn(),
      deleteContext: jest.fn(),
    };

    jest.spyOn(Auth, 'id').mockReturnValue(1);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminContextController],
      providers: [
        { provide: AdminContextService, useValue: service },
      ],
    }).compile();

    controller = module.get<AdminContextController>(AdminContextController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should throw ForbiddenException if no userId', async () => {
      jest.spyOn(Auth, 'id').mockReturnValue(null);
      await expect(
        controller.create({ type: 'test', name: 'Test' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should call service.createContext', async () => {
      const body = { type: 'test', name: 'Test' };
      await controller.create(body);
      expect(service.createContext).toHaveBeenCalledWith(body, 1);
    });
  });

  describe('getContexts', () => {
    it('should call service.getList', async () => {
      const query = { page: 1 };
      await controller.getContexts(query);
      expect(service.getList).toHaveBeenCalledWith(query);
    });
  });
});

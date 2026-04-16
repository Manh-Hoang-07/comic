import { Test, TestingModule } from '@nestjs/testing';
import { AdminMenuController } from '@/modules/system/menu/admin/controllers/menu.controller';
import { MenuService } from '@/modules/system/menu/admin/services/menu.service';
import { Auth } from '@/common/auth/utils';

describe('AdminMenuController', () => {
  let controller: AdminMenuController;
  let service: any;

  beforeEach(async () => {
    service = {
      getList: jest.fn(),
      getSimpleList: jest.fn(),
      getTree: jest.fn(),
      getOne: jest.fn(),
      createWithUser: jest.fn(),
      updateById: jest.fn(),
      deleteById: jest.fn(),
    };
    jest.spyOn(Auth, 'id').mockReturnValue(1);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminMenuController],
      providers: [
        { provide: MenuService, useValue: service },
      ],
    }).compile();

    controller = module.get<AdminMenuController>(AdminMenuController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call service.getTree', async () => {
    await controller.getTree();
    expect(service.getTree).toHaveBeenCalled();
  });
});

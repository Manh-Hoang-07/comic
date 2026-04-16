import { Test, TestingModule } from '@nestjs/testing';
import { PublicMenuController } from '@/modules/system/menu/public/controllers/menu.controller';
import { MenuService } from '@/modules/system/menu/admin/services/menu.service';
import { Auth } from '@/common/auth/utils';

describe('PublicMenuController', () => {
  let controller: PublicMenuController;
  let service: any;

  beforeEach(async () => {
    service = { getUserMenus: jest.fn() };
    jest.spyOn(Auth, 'id').mockReturnValue(1);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PublicMenuController],
      providers: [
        { provide: MenuService, useValue: service },
      ],
    }).compile();

    controller = module.get<PublicMenuController>(PublicMenuController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call service.getUserMenus with client group', async () => {
    await controller.getPublicMenus();
    expect(service.getUserMenus).toHaveBeenCalledWith(1, { group: 'client' });
  });
});

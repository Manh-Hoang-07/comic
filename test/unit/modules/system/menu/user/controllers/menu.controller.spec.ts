import { Test, TestingModule } from '@nestjs/testing';
import { UserMenuController } from '@/modules/system/menu/user/controllers/menu.controller';
import { MenuService } from '@/modules/system/menu/admin/services/menu.service';
import { Auth } from '@/common/auth/utils';

describe('UserMenuController', () => {
  let controller: UserMenuController;
  let service: any;

  beforeEach(async () => {
    service = { getUserMenus: jest.fn() };
    jest.spyOn(Auth, 'id').mockReturnValue(1);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserMenuController],
      providers: [
        { provide: MenuService, useValue: service },
      ],
    }).compile();

    controller = module.get<UserMenuController>(UserMenuController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call service.getUserMenus with admin group', async () => {
    await controller.getUserMenus();
    expect(service.getUserMenus).toHaveBeenCalledWith(1, { group: 'admin' });
  });
});

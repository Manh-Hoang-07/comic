import { Controller, Get } from '@nestjs/common';
import { Permission } from '@/common/auth/decorators';
import { Auth } from '@/common/auth/utils';
import { MenuService } from '@/modules/system/menu/admin/services/menu.service';

@Controller('admin/user/menus')
export class UserMenuController {
  constructor(private readonly service: MenuService) {}

  @Permission('user')
  @Get()
  async getUserMenus() {
    const userId = Auth.id();

    return this.service.getUserMenus(userId!, {
      group: 'admin',
    });
  }
}

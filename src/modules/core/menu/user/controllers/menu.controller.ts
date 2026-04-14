import { Controller, Get } from '@nestjs/common';
import { Permission } from '@/common/auth/decorators';
import { AuthService } from '@/common/auth/services';
import { MenuService } from '@/modules/core/menu/admin/services/menu.service';

@Controller('admin/user/menus')
export class UserMenuController {
  constructor(
    private readonly service: MenuService,
    private readonly auth: AuthService,
  ) {}

  @Permission('user')
  @Get()
  async getUserMenus() {
    const userId = this.auth.id();

    return this.service.getUserMenus(userId!, {
      group: 'admin',
    });
  }
}

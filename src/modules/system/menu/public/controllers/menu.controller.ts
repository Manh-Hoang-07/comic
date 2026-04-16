import { Controller, Get } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Permission } from '@/common/auth/decorators';
import { Auth } from '@/common/auth/utils';
import { MenuService } from '@/modules/system/menu/admin/services/menu.service';

@Throttle({ default: { limit: 50, ttl: 60000 } })
@Controller('public/menus')
export class PublicMenuController {
  constructor(private readonly service: MenuService) {}

  @Permission('public')
  @Get()
  async getPublicMenus() {
    const userId = Auth.id();

    return this.service.getUserMenus(userId ?? undefined, {
      group: 'client',
    });
  }
}

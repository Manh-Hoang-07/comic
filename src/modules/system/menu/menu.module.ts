import { Module } from '@nestjs/common';
import { AdminMenuModule } from '@/modules/system/menu/admin/menu.module';
import { UserMenuModule } from '@/modules/system/menu/user/menu.module';
import { PublicMenuModule } from '@/modules/system/menu/public/menu.module';
import { MenuRepositoryModule } from './menu.repository.module';

@Module({
  imports: [
    MenuRepositoryModule,
    AdminMenuModule,
    UserMenuModule,
    PublicMenuModule,
  ],
})
export class MenuModule {}

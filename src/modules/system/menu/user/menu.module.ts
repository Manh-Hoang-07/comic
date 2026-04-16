import { Module } from '@nestjs/common';
import { UserMenuController } from '@/modules/system/menu/user/controllers/menu.controller';
import { AdminMenuModule } from '@/modules/system/menu/admin/menu.module';
import { RbacModule } from '@/modules/system/rbac/rbac.module';

@Module({
  imports: [RbacModule, AdminMenuModule],
  controllers: [UserMenuController],
})
export class UserMenuModule {}

import { Module } from '@nestjs/common';
import { PublicMenuController } from './controllers/menu.controller';
import { AdminMenuModule } from '@/modules/system/menu/admin/menu.module';
import { RbacModule } from '@/modules/system/rbac/rbac.module';

@Module({
  imports: [RbacModule, AdminMenuModule],
  controllers: [PublicMenuController],
})
export class PublicMenuModule {}

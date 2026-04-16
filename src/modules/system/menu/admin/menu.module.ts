import { Module } from '@nestjs/common';
import { MenuService } from '@/modules/system/menu/admin/services/menu.service';
import { AdminMenuController } from '@/modules/system/menu/admin/controllers/menu.controller';
import { RbacModule } from '@/modules/system/rbac/rbac.module';
import { MenuRepositoryModule } from '../menu.repository.module';

@Module({
  imports: [RbacModule, MenuRepositoryModule],
  controllers: [AdminMenuController],
  providers: [MenuService],
  exports: [MenuService, RbacModule, MenuRepositoryModule],
})
export class AdminMenuModule {}

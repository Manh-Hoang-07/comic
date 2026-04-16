import { Module } from '@nestjs/common';
import { RoleService } from '@/modules/system/role/admin/services/role.service';
import { RoleController } from '@/modules/system/role/admin/controllers/role.controller';
import { RbacModule } from '@/modules/system/rbac/rbac.module';

import { RbacRepositoryModule } from '@/modules/system/rbac/rbac.repository.module';

@Module({
  imports: [RbacModule, RbacRepositoryModule],
  providers: [RoleService],
  controllers: [RoleController],
  exports: [RoleService],
})
export class AdminRoleModule {}

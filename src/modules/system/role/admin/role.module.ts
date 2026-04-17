import { Module } from '@nestjs/common';
import { RoleService } from '@/modules/system/role/admin/services/role.service';
import { RoleRelationService } from '@/modules/system/role/admin/services/role-relation.service';
import { RoleController } from '@/modules/system/role/admin/controllers/role.controller';
import { RbacModule } from '@/modules/system/rbac/rbac.module';

import { RbacRepositoryModule } from '@/modules/system/rbac/rbac.repository.module';

@Module({
  imports: [RbacModule, RbacRepositoryModule],
  providers: [RoleRelationService, RoleService],
  controllers: [RoleController],
  exports: [RoleService, RoleRelationService],
})
export class AdminRoleModule {}

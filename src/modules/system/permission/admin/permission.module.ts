import { Module } from '@nestjs/common';
import { PermissionService } from '@/modules/system/permission/admin/services/permission.service';
import { PermissionController } from '@/modules/system/permission/admin/controllers/permission.controller';
import { RbacModule } from '@/modules/system/rbac/rbac.module';

@Module({
  imports: [RbacModule],
  providers: [PermissionService],
  controllers: [PermissionController],
  exports: [PermissionService],
})
export class AdminPermissionModule {}

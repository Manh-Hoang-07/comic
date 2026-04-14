import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { AdminRoleModule } from './role/admin/role.module';
import { AdminPermissionModule } from './permission/admin/permission.module';
import { UserRepositoryModule } from './user.repository.module';
import { RbacModule } from '../rbac/rbac.module';

@Module({
  imports: [
    UserModule,
    AdminRoleModule,
    AdminPermissionModule,
    UserRepositoryModule,
    RbacModule,
  ],
  exports: [
    UserModule,
    AdminRoleModule,
    AdminPermissionModule,
    UserRepositoryModule,
    RbacModule,
  ],
})
export class IamModule {}

import { Module } from '@nestjs/common';
import { AdminUserModule } from './user/admin/user.module';
import { AdminRoleModule } from './role/admin/role.module';
import { AdminPermissionModule } from './permission/admin/permission.module';
import { UserRepositoryModule } from './user.repository.module';
import { UserProfileModule } from './user/user/user.module';
import { RbacModule } from '../rbac/rbac.module';

@Module({
  imports: [
    AdminUserModule,
    AdminRoleModule,
    AdminPermissionModule,
    UserRepositoryModule,
    UserProfileModule,
    RbacModule,
  ],
  exports: [
    AdminUserModule,
    AdminRoleModule,
    AdminPermissionModule,
    UserRepositoryModule,
    UserProfileModule,
    RbacModule,
  ],
})
export class IamModule { }

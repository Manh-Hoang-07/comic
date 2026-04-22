import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { RbacModule } from './rbac/rbac.module';
import { ContextModule } from './context/context.module';
import { NotificationModule } from './notification/notification.module';
import { AdminRoleModule } from './role/admin/role.module';
import { AdminPermissionModule } from './permission/admin/permission.module';
import { UserRepositoryModule } from './user.repository.module';
import { MenuModule } from './menu/menu.module';
import { SystemConfigModule } from './system-config/system-config.module';
import { ContentTemplateModule } from './content-template/content-template.module';
import { QueueWorkerModule } from './queue/queue.module';
import { LocationModule } from './location/location.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    AuthModule,
    RbacModule,
    ContextModule,
    NotificationModule,
    AdminRoleModule,
    AdminPermissionModule,
    UserRepositoryModule,
    MenuModule,
    SystemConfigModule,
    ContentTemplateModule,
    QueueWorkerModule,
    LocationModule,
    UserModule,
  ],
  exports: [
    AuthModule,
    RbacModule,
    ContextModule,
    NotificationModule,
    AdminRoleModule,
    AdminPermissionModule,
    UserRepositoryModule,
    MenuModule,
    SystemConfigModule,
    ContentTemplateModule,
    QueueWorkerModule,
    LocationModule,
    UserModule,
  ],
})
export class SystemModule {}

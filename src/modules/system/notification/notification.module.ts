import { Module } from '@nestjs/common';
import { NotificationService } from '@/modules/system/notification/admin/services/notification.service';
import { NotificationController as AdminNotificationController } from '@/modules/system/notification/admin/controllers/notification.controller';
import { NotificationController as UserNotificationController } from '@/modules/system/notification/user/controllers/notification.controller';
import { RbacModule } from '@/modules/system/rbac/rbac.module';

// Import repository module
import { NotificationRepositoryModule } from '@/modules/system/notification/notification.repository.module';

@Module({
  imports: [RbacModule, NotificationRepositoryModule],
  controllers: [AdminNotificationController, UserNotificationController],
  providers: [NotificationService],
  exports: [NotificationService, NotificationRepositoryModule],
})
export class NotificationModule {}

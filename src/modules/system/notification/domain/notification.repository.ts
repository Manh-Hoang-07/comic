import { Notification } from '@prisma/client';
import { IRepository } from '@/common/core/repositories';

export const NOTIFICATION_REPOSITORY = 'INotificationRepository';

export interface NotificationFilter {
  search?: string;
  userId?: any;
  isRead?: boolean;
  type?: string;
  status?: string;
}

export interface INotificationRepository extends IRepository<Notification> {
  markAsRead(id: any): Promise<Notification>;
  markAllAsRead(userId: any): Promise<void>;
}

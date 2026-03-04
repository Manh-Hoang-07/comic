export enum NotificationType {
  info = 'info',
  success = 'success',
  warning = 'warning',
  error = 'error',
  promotion = 'promotion',
}

/**
 * Labels cho NotificationType
 */
export const NotificationTypeLabels: Record<NotificationType, string> = {
  [NotificationType.info]: 'Thông tin',
  [NotificationType.success]: 'Thành công',
  [NotificationType.warning]: 'Cảnh báo',
  [NotificationType.error]: 'Lỗi',
  [NotificationType.promotion]: 'Khuyến mãi',
};




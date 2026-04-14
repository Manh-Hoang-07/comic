import { SetMetadata } from '@nestjs/common';

export const LOG_REQUEST_KEY = 'log_request';

export interface LogRequestOptions {
  /** Tên file log (sẽ tự động thêm vào thư mục theo ngày: logs/YYYY-MM-DD/<fileBaseName>.log). Mặc định: 'api-requests' */
  fileBaseName?: string;
  /** Đường dẫn file log tuyệt đối (nếu không dùng fileBaseName) */
  filePath?: string;
}

/**
 * Decorator để đánh dấu API cần lưu log
 *
 * Mặc định tất cả API không lưu log để tiết kiệm bộ nhớ.
 * Chỉ những API được đánh dấu bằng @LogRequest() mới được lưu log.
 * File log sẽ tự động được tổ chức theo ngày: logs/YYYY-MM-DD/
 */
export const LogRequest = (options?: LogRequestOptions) =>
  SetMetadata(LOG_REQUEST_KEY, options || { fileBaseName: 'api-requests' });

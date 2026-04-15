import type { PrimaryKey } from '@/common/core/utils/primary-key.util';

export interface LogContext {
  context?: string;
  trace?: string;
  userId?: PrimaryKey | null;
  username?: string | null;
  requestId?: string;
  method?: string;
  url?: string;
  ip?: string;
  userAgent?: string;
  extra?: Record<string, any>;
  [key: string]: any;
}

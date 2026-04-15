import { ExecutionContext } from '@nestjs/common';
import { RequestContext } from '@/common/shared/utils';
import type { PrimaryKey } from '@/common/core/utils/primary-key.util';

export interface AuthenticatedUser {
  id: PrimaryKey;
  email?: string;
  username?: string;
  status?: string;
  [key: string]: unknown;
}

/**
 * Get current authenticated user from global RequestContext or ExecutionContext.
 */
export function getCurrentUser(
  context?: ExecutionContext,
): AuthenticatedUser | null {
  if (context) {
    const request = context.switchToHttp().getRequest();
    return request.user || null;
  }
  return RequestContext.get<AuthenticatedUser | null>('user') || null;
}

/**
 * Get current authenticated user ID.
 */
export function getCurrentUserId(context?: ExecutionContext): PrimaryKey | null {
  const user = getCurrentUser(context);
  if (!user) return null;
  return user.id;
}

/**
 * Check if a user is currently logged in.
 */
export function isAuthenticated(context?: ExecutionContext): boolean {
  return !!getCurrentUser(context);
}

/**
 * Get a specific property from the current user object.
 */
export function getUserProperty<T = unknown>(
  key: keyof AuthenticatedUser | string,
  context?: ExecutionContext,
): T | null {
  const user = getCurrentUser(context);
  return user ? (user[key as string] as T) : null;
}

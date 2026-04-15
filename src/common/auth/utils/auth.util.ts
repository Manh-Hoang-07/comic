import { ExecutionContext } from '@nestjs/common';
import type { PrimaryKey } from '@/common/core/utils/primary-key.util';
import {
  getCurrentUser,
  getCurrentUserId,
  isAuthenticated,
  getUserProperty,
  AuthenticatedUser,
} from './auth-context.helper';

/**
 * Singleton-style Utility for Auth.
 * Acts as a wrapper for auth-context helpers.
 */
export class Auth {
  /** Get current user object. */
  static user(context?: ExecutionContext): AuthenticatedUser | null {
    return getCurrentUser(context);
  }

  /** Get current user ID. */
  static id(context?: ExecutionContext): PrimaryKey | null {
    return getCurrentUserId(context);
  }

  /** Check if user is logged in. */
  static check(context?: ExecutionContext): boolean {
    return isAuthenticated(context);
  }

  /** Alias for check(). */
  static isLogin(context?: ExecutionContext): boolean {
    return isAuthenticated(context);
  }

  /** Alias for check(). */
  static guest(context?: ExecutionContext): boolean {
    return !isAuthenticated(context);
  }

  /** Access current user properties dynamicallly. */
  static email(context?: ExecutionContext): string | null {
    return getUserProperty<string>('email', context);
  }

  static username(context?: ExecutionContext): string | null {
    return getUserProperty<string>('username', context);
  }

  static status(context?: ExecutionContext): string | null {
    return getUserProperty<string>('status', context);
  }

  /** Generic getter for user field. */
  static get<T = unknown>(key: string, context?: ExecutionContext): T | null {
    return getUserProperty<T>(key, context);
  }
}

import { ExecutionContext } from '@nestjs/common';
import { RequestContext } from '@/common/shared/utils';

export interface AuthenticatedUser {
    id: number | bigint;
    email?: string;
    username?: string;
    status?: string;
    [key: string]: any;
}

/**
 * Get current authenticated user from global RequestContext or ExecutionContext.
 */
export function getCurrentUser(context?: ExecutionContext): AuthenticatedUser | null {
    if (context) {
        const request = context.switchToHttp().getRequest();
        return request.user || null;
    }
    return RequestContext.get<AuthenticatedUser | null>('user') || null;
}

/**
 * Get current authenticated user ID.
 */
export function getCurrentUserId(context?: ExecutionContext): number | null {
    const user = getCurrentUser(context);
    if (!user) return null;
    return typeof user.id === 'bigint' ? Number(user.id) : user.id;
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
export function getUserProperty<T = any>(
    key: keyof AuthenticatedUser | string,
    context?: ExecutionContext,
): T | null {
    const user = getCurrentUser(context);
    return user ? (user[key as string] as T) : null;
}

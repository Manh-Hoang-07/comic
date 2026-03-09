import {
  ExecutionContext,
  Injectable,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { PERMS_REQUIRED_KEY, PUBLIC_PERMISSION } from '@/common/auth/decorators';
import { ResponseUtil } from '@/common/shared/utils';
import { TokenBlacklistService } from '@/core/security/token-blacklist.service';
import { RequestContext } from '@/common/shared/utils';
import { extractBearerToken, isJwtExpired } from './jwt-token.helper';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokenBlacklist: TokenBlacklistService,
  ) {
    super();
  }

  // ── canActivate ────────────────────────────────────────────────────────────

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = extractBearerToken(request.headers.authorization);
    const isPublic = this.isPublicRoute(context);

    // Reject blacklisted tokens regardless of route visibility
    if (token && this.tokenBlacklist) {
      const blocked = await this.tokenBlacklist.has(token);
      if (blocked) {
        this.clearAuth(request);
        return false;
      }
    }

    if (isPublic) {
      return this.handlePublicRoute(context, request, token);
    }

    return this.handleProtectedRoute(context);
  }

  // ── handleRequest ──────────────────────────────────────────────────────────

  handleRequest(
    err: any,
    user: any,
    info: any,
    context: ExecutionContext,
  ): any {
    const request = context.switchToHttp().getRequest();
    const isPublic = this.isPublicRoute(context);

    if (isPublic) {
      // Token expired or invalid → clear auth, allow access (public)
      if (info?.name === 'TokenExpiredError' || err || !user) {
        this.clearAuth(request);
        return null;
      }
      this.setAuthContext(user);
      return user;
    }

    // Protected route: user must be present
    if (err || !user) {
      if (err) throw err;
      const message = this.resolveUnauthorizedMessage(info);
      const res = ResponseUtil.unauthorized(message);
      throw new HttpException(res, res.httpStatus || HttpStatus.UNAUTHORIZED);
    }

    this.setAuthContext(user);
    return user;
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  /** Check if the current route is decorated with @Permission('public'). */
  private isPublicRoute(context: ExecutionContext): boolean {
    const perms =
      this.reflector.getAllAndOverride<string[]>(PERMS_REQUIRED_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) || [];
    return perms.includes(PUBLIC_PERMISSION);
  }

  /** Clear user from request and shared request context. */
  private clearAuth(request: any): void {
    request.user = null;
    try {
      RequestContext.set('user', null);
      RequestContext.set('userId', null);
    } catch { }
  }

  /** Store authenticated user in the shared request context. */
  private setAuthContext(user: any): void {
    try {
      RequestContext.set('user', user);
      RequestContext.set('userId', user.id);
    } catch { }
  }

  /**
   * Handle a public route:
   * - No token → allow without auth.
   * - Expired token → allow without auth.
   * - Valid token → try Passport validation (optional).
   */
  private async handlePublicRoute(
    context: ExecutionContext,
    request: any,
    token: string | null,
  ): Promise<boolean> {
    if (!token) {
      this.clearAuth(request);
      return true;
    }

    if (isJwtExpired(token)) {
      this.clearAuth(request);
      return true;
    }

    // Token present and not expired: try optional validation
    try {
      const result = super.canActivate(context);
      return await resolveActivateResult(result, () => {
        this.clearAuth(request);
        return true;
      });
    } catch {
      this.clearAuth(request);
      return true;
    }
  }

  /** Handle a protected route: delegate fully to Passport. */
  private async handleProtectedRoute(
    context: ExecutionContext,
  ): Promise<boolean> {
    try {
      const result = super.canActivate(context);
      return await resolveActivateResult(result, () => false);
    } catch {
      return false;
    }
  }

  private resolveUnauthorizedMessage(info: any): string {
    if (info?.name === 'TokenExpiredError') return 'Token expired';
    if (info?.name === 'JsonWebTokenError') return 'Invalid token';
    return info?.message || 'Unauthorized';
  }
}

// ── Module-level helper ───────────────────────────────────────────────────────

/** Normalize the various return types of `AuthGuard.canActivate` to a Promise<boolean>. */
async function resolveActivateResult(
  result: boolean | Promise<boolean> | Observable<boolean>,
  onError: () => boolean,
): Promise<boolean> {
  if (result instanceof Promise) {
    return result.catch(onError);
  }
  if (result instanceof Observable) {
    return new Promise<boolean>((resolve) => {
      result.pipe(catchError(() => of(onError()))).subscribe({
        next: (v) => resolve(!!v),
        error: () => resolve(onError()),
      });
    });
  }
  return !!result;
}

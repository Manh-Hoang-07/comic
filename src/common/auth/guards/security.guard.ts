import {
  ExecutionContext,
  Injectable,
  HttpException,
  HttpStatus,
  Logger,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import {
  PERMS_REQUIRED_KEY,
  PUBLIC_PERMISSION,
} from '@/common/auth/decorators';
import { ResponseUtil, RequestContext } from '@/common/shared/utils';
import { TokenBlacklistService } from '@/core/security/token-blacklist.service';
import { CheckpointTracker } from '@/core/logger/checkpoint-tracker';
import { extractBearerToken } from './jwt-token.helper';
import { RbacService } from '@/modules/core/rbac/services/rbac.service';
import { RbacAuthorizationOrchestrator } from '@/modules/core/rbac/services/rbac-authorization.orchestrator';
import { RbacPermission } from '@/modules/core/rbac/rbac.constants';
import { Auth } from '@/common/auth/utils';

@Injectable()
export class SecurityGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(SecurityGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly tokenBlacklist: TokenBlacklistService,
    private readonly rbac: RbacService,
    private readonly rbacAuthz: RbacAuthorizationOrchestrator,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const tracker = RequestContext.get<CheckpointTracker>('tracker');
    tracker?.addCheckpoint('security_guard_enter');

    const request = context.switchToHttp().getRequest();
    const token = extractBearerToken(request.headers.authorization);

    // 1. Get metadata (Public and Permissions)
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);
    const permissions =
      this.reflector.getAllAndOverride<string[]>(PERMS_REQUIRED_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) || [];

    // 2. Handle Public Routes
    if (isPublic || permissions.includes(PUBLIC_PERMISSION)) {
      if (token) {
        // Optional login for public routes (e.g., to record user_id)
        await this.handlePassportAuth(context).catch(() => true);
      }
      tracker?.addCheckpoint('security_guard_end');
      return true;
    }

    // 3. Handle Protected Routes
    const isUserOnly = permissions.some((p) =>
      [RbacPermission.USER, 'user'].includes(p as any),
    );

    // Parallelize all checks to minimize latency
    const authPromise = this.handlePassportAuth(context);
    const blacklistPromise =
      token && this.tokenBlacklist
        ? this.tokenBlacklist.has(token)
        : Promise.resolve(false);

    // Only run RBAC logic if permissions beyond 'user' are required
    const needsRbac = permissions.length > 0 && !isUserOnly;
    const groupPromise = needsRbac
      ? this.rbacAuthz.resolveActiveGroupScopeForRbac()
      : Promise.resolve(null);
    const preparePromise = needsRbac ? this.rbac.prepare() : Promise.resolve();

    const [isAuthOk, isBlocked, groupId] = await Promise.all([
      authPromise,
      blacklistPromise,
      groupPromise,
      preparePromise,
    ]);

    tracker?.addCheckpoint('security_auth_parallel_end');

    // 4. Validate Results
    if (!isAuthOk) {
      throw new HttpException(ResponseUtil.unauthorized('Auth required'), 401);
    }

    if (isBlocked) {
      this.clearAuth(request);
      throw new HttpException(
        ResponseUtil.unauthorized('Token is blacklisted'),
        401,
      );
    }

    // 5. Final RBAC Check
    if (needsRbac) {
      const userId = Auth.id(context) || request.user?.id;
      if (!userId)
        throw new HttpException(
          ResponseUtil.unauthorized('User identity lost'),
          401,
        );

      const hasPerms = await this.rbac.hasPermissions(
        userId,
        groupId,
        permissions,
      );
      if (!hasPerms) {
        const res = ResponseUtil.forbidden(
          `Access denied. Need: ${permissions.join(',')}`,
        );
        throw new HttpException(res, res.httpStatus || 403);
      }
      tracker?.addCheckpoint('security_rbac_check_end');
    }

    tracker?.addCheckpoint('security_guard_end');
    return true;
  }

  /**
   * Make authenticated user available via RequestContext so `Auth.*()` works
   * without needing an ExecutionContext (e.g. inside controllers/services).
   */
  handleRequest(
    err: any,
    user: any,
    _info: any,
    context: ExecutionContext,
  ): any {
    const request = context.switchToHttp().getRequest();

    if (err || !user) {
      this.clearAuth(request);
      return null;
    }

    this.setAuthContext(request, user);
    return user;
  }

  /**
   * Run Passport JWT strategy
   */
  private async handlePassportAuth(
    context: ExecutionContext,
  ): Promise<boolean> {
    try {
      const result = super.canActivate(context);
      if (result instanceof Promise) return await result;
      if (typeof (result as any)?.toPromise === 'function')
        return await (result as any).toPromise();
      return result as boolean;
    } catch (err) {
      return false;
    }
  }

  private clearAuth(request: any): void {
    request.user = null;
    request.userId = null;
    RequestContext.set('user', null);
    RequestContext.set('userId', null);
  }

  private setAuthContext(request: any, user: any): void {
    request.user = user;
    request.userId = user?.id ?? null;
    RequestContext.set('user', user);
    RequestContext.set('userId', user?.id ?? null);
  }
}

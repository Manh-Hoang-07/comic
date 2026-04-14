import {
  CanActivate,
  ExecutionContext,
  Injectable,
  HttpException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  PERMS_REQUIRED_KEY,
  PUBLIC_PERMISSION,
} from '@/common/auth/decorators';
import { RbacService } from '@/modules/core/rbac/services/rbac.service';
import { RbacAuthorizationOrchestrator } from '@/modules/core/rbac/services/rbac-authorization.orchestrator';
import { Auth } from '@/common/auth/utils';
import { RequestContext } from '@/common/shared/utils';
import { CheckpointTracker } from '@/core/logger/checkpoint-tracker';
import { ResponseUtil } from '@/common/shared/utils';
import { RbacPermission } from '@/modules/core/rbac/rbac.constants';

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rbac: RbacService,
    private readonly rbacAuthz: RbacAuthorizationOrchestrator,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const tracker = RequestContext.get<CheckpointTracker>('tracker');
    tracker?.addCheckpoint('rbac_guard_enter');

    const permissions =
      this.reflector.getAllAndOverride<string[]>(PERMS_REQUIRED_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) || [];
    if (!permissions.length)
      throw new HttpException(ResponseUtil.forbidden('Access denied.'), 403);
    if (permissions.includes(PUBLIC_PERMISSION)) return true;

    const userId = Auth.id(context);
    if (!userId)
      throw new HttpException(ResponseUtil.unauthorized('Auth required'), 401);

    if (
      permissions.some((p) => [RbacPermission.USER, 'user'].includes(p as any))
    )
      return true;

    // Start preparing RBAC indexes in parallel with group resolution
    const preparePromise = this.rbac.prepare();
    const groupPromise = this.rbacAuthz.resolveActiveGroupScopeForRbac();

    const [_, groupId] = await Promise.all([preparePromise, groupPromise]);
    tracker?.addCheckpoint('rbac_guard_resolve_group_end');

    if (await this.rbac.hasPermissions(userId, groupId, permissions)) {
      tracker?.addCheckpoint('rbac_guard_has_perms_end');
      return true;
    }

    const res = ResponseUtil.forbidden(
      `Access denied. Need: ${permissions.join(',')}`,
    );
    throw new HttpException(res, res.httpStatus || 403);
  }
}

import { CanActivate, ExecutionContext, Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMS_REQUIRED_KEY, PUBLIC_PERMISSION } from '@/common/auth/decorators';
import { RbacService } from '@/modules/core/rbac/services/rbac.service';
import { Auth } from '@/common/auth/utils';
import { RequestContext } from '@/common/shared/utils';
import { ResponseUtil } from '@/common/shared/utils';
import { RbacPermission } from '@/modules/core/rbac/rbac.constants';
import { CustomLoggerService } from '@/core/logger/logger.service';

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private reflector: Reflector, private rbac: RbacService) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permissions = this.reflector.getAllAndOverride<string[]>(PERMS_REQUIRED_KEY, [context.getHandler(), context.getClass()]) || [];
    if (!permissions.length) throw new HttpException(ResponseUtil.forbidden('Access denied.'), 403);
    if (permissions.includes(PUBLIC_PERMISSION)) return true;

    const userId = Auth.id(context);
    if (!userId) throw new HttpException(ResponseUtil.unauthorized('Auth required'), 401);

    if (permissions.some(p => [RbacPermission.AUTHENTICATED, RbacPermission.USER, 'authenticated', 'user'].includes(p as any))) return true;

    const groupId = RequestContext.get<number | null>('groupId') ?? null;
    if (await this.rbac.userHasPermissionsInGroup(userId, groupId, permissions)) return true;

    const res = ResponseUtil.forbidden(`Access denied. Need: ${permissions.join(',')}`);
    throw new HttpException(res, res.httpStatus || 403);
  }
}

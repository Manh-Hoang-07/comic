import { CanActivate, ExecutionContext, Injectable, HttpException, BadRequestException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMS_REQUIRED_KEY, PUBLIC_PERMISSION } from '@/common/auth/decorators';
import { RbacService } from '@/modules/core/rbac/services/rbac.service';
import { Auth } from '@/common/auth/utils';
import { RequestContext } from '@/common/shared/utils';
import { ResponseUtil } from '@/common/shared/utils';
import { RbacPermission } from '@/modules/core/rbac/rbac.constants';
import { AdminGroupService } from '@/modules/core/context/group/admin/services/group.service';

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rbac: RbacService,
    private readonly groupService: AdminGroupService,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permissions = this.reflector.getAllAndOverride<string[]>(PERMS_REQUIRED_KEY, [context.getHandler(), context.getClass()]) || [];
    if (!permissions.length) throw new HttpException(ResponseUtil.forbidden('Access denied.'), 403);
    if (permissions.includes(PUBLIC_PERMISSION)) return true;

    const userId = Auth.id(context);
    if (!userId) throw new HttpException(ResponseUtil.unauthorized('Auth required'), 401);

    if (permissions.some(p => [RbacPermission.USER, 'user'].includes(p as any))) return true;
    const groupIdRaw = RequestContext.get<any>('groupIdRaw') ?? null;
    let groupId: any | null = groupIdRaw ?? null;

    if (groupId !== null) {
      const group = await this.groupService.getContextSnapshot(groupId).catch(() => null);
      if (!group) throw new BadRequestException('Group not found');
      if (!this.isActive(group)) throw new BadRequestException('Group is inactive');
      if (!group.context || !this.isActive(group.context)) throw new BadRequestException('Context is missing or inactive');

      const contextId = group.context?.id ?? group.context_id ?? null;
      if (!contextId) throw new BadRequestException('Context is invalid');

      RequestContext.set('groupId', group.id ?? groupId);
      RequestContext.set('context', group.context);
      RequestContext.set('contextId', contextId);
      groupId = group.id ?? groupId;
    }

    if (await this.rbac.userHasPermissionsInGroup(userId, groupId, permissions)) {
      return true;
    }

    const res = ResponseUtil.forbidden(`Access denied. Need: ${permissions.join(',')}`);
    throw new HttpException(res, res.httpStatus || 403);
  }

  private isActive(entity: any): boolean {
    return (entity?.status ?? 'active') === 'active';
  }
}

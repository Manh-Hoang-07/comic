import { Injectable, NestInterceptor, ExecutionContext, CallHandler, ForbiddenException, BadRequestException, Inject } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { RequestContext } from '@/common/shared/utils';
import { AdminContextService } from '@/modules/core/context/context/admin/services/context.service';
import { AdminGroupService } from '@/modules/core/context/group/admin/services/group.service';
import { Auth } from '@/common/auth/utils';
import { PERMS_REQUIRED_KEY, PUBLIC_PERMISSION } from '@/common/auth/decorators';
import { RbacService } from '@/modules/core/rbac/services/rbac.service';
import { IUserGroupRepository, USER_GROUP_REPOSITORY } from '@/modules/core/rbac/user-group/domain/user-group.repository';

@Injectable()
export class GroupInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly contextService: AdminContextService,
    private readonly groupService: AdminGroupService,
    @Inject(USER_GROUP_REPOSITORY)
    private readonly userGroupRepo: IUserGroupRepository,
    private readonly rbacService: RbacService,
  ) { }

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const permissions = this.reflector.getAllAndOverride<string[]>(PERMS_REQUIRED_KEY, [context.getHandler(), context.getClass()]) || [];
    const isPublicEndpoint = permissions.includes(PUBLIC_PERMISSION);

    const groupIdRaw = request.headers['x-group-id'] || request.headers['group-id'] || request.headers['group_id'];
    const groupId = groupIdRaw ? Number(groupIdRaw) : null;

    if (groupId) {
      const group = await this.groupService.findById(groupId).catch(() => null);
      if (!group) {
        if (isPublicEndpoint) return this.setSysCtx(next);
        throw new BadRequestException('Group not found');
      }

      const userId = Auth.id(context);
      if (userId && !isPublicEndpoint) {
        const hasAccess = (await this.userGroupRepo.findUnique(userId, groupId)) || (await this.rbacService.isSystemAdmin(userId));
        if (!hasAccess) throw new ForbiddenException(`Access denied to group ${groupId}`);
      }

      RequestContext.set('groupId', group.id);
      const contextId = group.context?.id || group.context_id;
      RequestContext.set('contextId', Number(contextId));
    } else {
      return this.setSysCtx(next);
    }
    return next.handle();
  }

  private async setSysCtx(next: CallHandler) {
    const sys = await this.contextService.getSystemContext();
    RequestContext.set('contextId', sys ? Number(sys.id) : null);
    RequestContext.set('groupId', null);
    return next.handle();
  }
}

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { RequestContext } from '@/common/shared/utils';
import { AdminContextService } from '@/modules/core/context/context/admin/services/context.service';
import { AdminGroupService } from '@/modules/core/context/group/admin/services/group.service';
import { PERMS_REQUIRED_KEY, PUBLIC_PERMISSION } from '@/common/auth/decorators';
import { CustomLoggerService } from '@/core/logger/logger.service';

@Injectable()
export class GroupInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly contextService: AdminContextService,
    private readonly groupService: AdminGroupService,
  ) { }

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();

    const groupId = request.headers['x-group-id'] || request.headers['group-id'] || request.headers['group_id'] || null;

    const permissions =
      this.reflector.getAllAndOverride<string[]>(PERMS_REQUIRED_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) || [];
    const isPublicEndpoint = permissions.includes(PUBLIC_PERMISSION);

    if (groupId) {
      const group = await this.groupService.getOne(groupId).catch(() => null);

      if (!group) {
        CustomLoggerService.write(
          {
            message: 'GroupInterceptor resolve group failed',
            headerGroupId: groupId,
            isPublicEndpoint,
          },
          './logs/group-context-debug.log',
        );
        if (isPublicEndpoint) return this.setSysCtx(next);
        throw new BadRequestException('Group not found');
      }

      CustomLoggerService.write(
        {
          message: 'GroupInterceptor resolved group context',
          headerGroupId: groupId,
          resolvedGroupId: group.id?.toString?.() ?? String(group.id),
          resolvedGroupCode: group.code ?? null,
          resolvedContextType: group.context?.type ?? null,
          resolvedContextId: group.context?.id?.toString?.() ?? String(group.context?.id ?? group.context_id ?? ''),
          isPublicEndpoint,
        },
        './logs/group-context-debug.log',
      );

      RequestContext.set('groupId', group.id);
      RequestContext.set('context', group.context);
      RequestContext.set('contextId', group.context?.id || group.context_id);
      return next.handle();
    }

    if (isPublicEndpoint) {
      RequestContext.set('groupId', null);
      RequestContext.set('contextId', null);
      RequestContext.set('context', null);
      return next.handle();
    }

    return this.setSysCtx(next);
  }

  private async setSysCtx(next: CallHandler) {
    const sys = await this.contextService.getSystemContext();
    RequestContext.set('contextId', sys?.id || null);
    RequestContext.set('context', sys);
    RequestContext.set('groupId', null);
    return next.handle();
  }
}

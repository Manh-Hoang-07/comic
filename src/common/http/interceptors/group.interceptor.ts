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

    // Check if this is a public endpoint
    const requiredPerms = this.reflector.getAllAndOverride<string[]>(PERMS_REQUIRED_KEY, [
      context.getHandler(),
      context.getClass(),
    ]) || [];
    const isPublicEndpoint = requiredPerms.includes(PUBLIC_PERMISSION);

    // 1. Chỉ lấy groupId từ Header (X-Group-Id)
    const groupIdRaw = request.headers['x-group-id'] || request.headers['group-id'] || request.headers['group_id'];
    const groupId = groupIdRaw ? Number(groupIdRaw) : null;

    if (groupId) {
      // TRƯỜNG HỢP CÓ GROUP_ID TRONG HEADER
      let group: any = null;
      try {
        group = await this.groupService.findById(groupId);
      } catch (e) {
        group = null;
      }

      if (!group) {
        // Nếu là public endpoint thì cho qua với System Context, nếu không thì báo lỗi
        if (isPublicEndpoint) {
          const sysContext = await this.contextService.getSystemContext();
          RequestContext.set('contextId', sysContext ? Number(sysContext.id) : null);
          RequestContext.set('groupId', null);
          return next.handle();
        }
        throw new BadRequestException('Group not found');
      }

      // Validate quyền truy cập Group
      const userId = Auth.id(context);
      if (userId && !isPublicEndpoint) {
        // 🚀 [Tối ưu] Chỉ check membership bằng findUnique O(1) thay vì getUserGroups() O(N)
        const userInGroup = await this.userGroupRepo.findUnique(userId, groupId);
        let hasAccess = !!userInGroup;

        // Nếu không trong nhóm, kiểm tra xem có phải Global Admin (System Context) không
        if (!hasAccess) {
          hasAccess = await this.rbacService.isSystemAdmin(userId);
        }

        if (!hasAccess) {
          throw new ForbiddenException(
            `Access denied to group ${groupId}. You do not have permission to access this group.`
          );
        }
      }

      // Thiết lập Context và Group ID vào RequestContext
      RequestContext.set('groupId', group.id);
      if (group.context) {
        RequestContext.set('context', group.context);
        RequestContext.set('contextId', Number(group.context.id));
      } else {
        const contextEntity = await this.contextService.findById(Number(group.context_id));
        if (contextEntity) {
          RequestContext.set('context', contextEntity);
          RequestContext.set('contextId', Number(contextEntity.id));
        }
      }
    } else {
      // TRƯỜNG HỢP KHÔNG CÓ GROUP_ID TRONG HEADER
      // Mặc định về System Context, Group: null
      const sysContext = await this.contextService.getSystemContext();
      RequestContext.set('contextId', sysContext ? Number(sysContext.id) : null);
      RequestContext.set('groupId', null);
    }

    return next.handle();
  }
}

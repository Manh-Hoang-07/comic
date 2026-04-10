import { Injectable, ForbiddenException, Inject } from '@nestjs/common';
import { BaseService } from '@/common/core/services';
import { getGroupFilter } from '@/common/shared/utils/group-ownership.util';
import { getCurrentUserId } from '@/common/auth/utils/auth-context.helper';
import { RequestContext } from '@/common/shared/utils';
import { toPrimaryKey } from '@/common/core/repositories/prisma-query.helper';
import { IUserRepository, USER_REPOSITORY } from '@/modules/core/user/domain/user.repository';
import { ChangePasswordDto } from '../dtos/change-password.dto';
import { PasswordService } from './password.service';
import { RelationService } from './relation.service';

@Injectable()
export class UserService extends BaseService<any, IUserRepository> {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepo: IUserRepository,
    private readonly passwordService: PasswordService,
    private readonly actionService: RelationService,
  ) {
    super(userRepo);
  }

  // ── Context Validation ─────────────────────────────────────────────────────

  private async verifyUserContextOwnership(userId: any): Promise<void> {
    const context = RequestContext.get<any>('context');
    const groupId = RequestContext.get<any>('groupId');

    if (context?.type === 'system') return;

    if (!context || !groupId) throw new ForbiddenException('No context available');

    const isValid = await this.userRepo.exists({
       id: toPrimaryKey(userId),
       user_groups: {
          some: { group_id: toPrimaryKey(groupId) }
       }
    });

    if (!isValid) throw new ForbiddenException('Lỗi Context: Bạn không có quyền truy cập người dùng hệ thống khác!');
  }

  // ── Password & Action Delegates ────────────────────────────────────────────

  async changePassword(id: any, dto: ChangePasswordDto) {
    await this.verifyUserContextOwnership(id);
    return this.passwordService.changePassword(id, dto);
  }

  async getUserRoles(id: any, groupIds?: any) {
    await this.verifyUserContextOwnership(id);

    const ids = typeof groupIds === 'string'
      ? groupIds.split(',').filter(Boolean)
      : (Array.isArray(groupIds) ? groupIds : undefined);

    const assignments = await this.userRepo.findAssignments(id, ids);
    const grouped = new Map<any, any>();

    for (const assignment of assignments) {
      const groupId = assignment.group_id;
      if (!grouped.has(groupId)) {
        grouped.set(groupId, {
          group_id: groupId,
          group_code: assignment.group?.code,
          group_name: assignment.group?.name,
          roles: [],
        });
      }

      const groupEntry = grouped.get(groupId);
      const isExistedRole = groupEntry.roles.some((role: any) => role.role_id === assignment.role_id);
      if (!isExistedRole) {
        groupEntry.roles.push({
          role_id: assignment.role_id,
          role_code: assignment.role?.code,
          role_name: assignment.role?.name,
        });
      }
    }

    return Array.from(grouped.values());
  }

  // ── Lifecycle Hooks ────────────────────────────────────────────────────────

  protected override async prepareFilters(filter: any) {
    const context = RequestContext.get<any>('context');
  
    if (context?.type === 'system') {
      return { ...filter, ...getGroupFilter(filter) };
    }

    const ctxGroupId = RequestContext.get<any>('groupId');
    return { ...filter, groupId: ctxGroupId };
  }

  override async getOne(id: any, options: any = {}) {
    await this.verifyUserContextOwnership(id);
    return super.getOne(id);
  }

  protected override async beforeCreate(data: any) {
    const payload = { ...data };
    payload.created_user_id = getCurrentUserId();
    payload.updated_user_id = payload.created_user_id;

    if (payload.password) {
      payload.password = await this.passwordService.hash(payload.password);
    }

    await this.validateUniqueness(payload);

    // Ensure we don't accidentally save relational data in main table
    delete payload.profile;

    return payload;
  }

  protected override async afterCreate(user: any, data: any): Promise<void> {
    await this.actionService.sync(user.id, data);
  }

  protected override async beforeUpdate(id: any, data: any) {
    await this.verifyUserContextOwnership(id);
    const payload = { ...data };
    payload.updated_user_id = getCurrentUserId();

    if (payload.password) {
      payload.password = await this.passwordService.hash(payload.password);
    } else {
      delete payload.password;
    }

    await this.validateUniqueness(payload, id);

    // Ensure we don't accidentally save relational data in main table
    delete payload.profile;

    return payload;
  }

  protected override async afterUpdate(user: any, data: any): Promise<void> {
    await this.actionService.sync(user.id, data);
  }

  protected override async beforeDelete(id: any): Promise<boolean> {
    await this.verifyUserContextOwnership(id);
    return true;
  }

  // ── Helpers & Transformations ──────────────────────────────────────────────

  private async validateUniqueness(payload: any, excludeId?: any): Promise<void> {
    await this.userRepo.checkMultipleUniques(
      {
        email: payload.email,
        phone: payload.phone,
        username: payload.username,
      },
      excludeId,
    );
  }

  protected override transform(user: any) {
    if (!user) return user;
    const { password, ...u } = user;
    return u;
  }
}


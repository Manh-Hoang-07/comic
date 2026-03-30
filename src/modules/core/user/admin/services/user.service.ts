import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { RequestContext } from '@/common/shared/utils';
import { BaseService } from '@/common/core/services';
import { getGroupFilter } from '@/common/shared/utils/group-ownership.util';
import { getCurrentUserId } from '@/common/auth/utils/auth-context.helper';
import { UserRepository } from '@/modules/core/user/repositories/user.repository';
import { ChangePasswordDto } from '../dtos/change-password.dto';
import { UserPasswordService } from './user-password.service';
import { UserActionService } from './user-action.service';

@Injectable()
export class UserService extends BaseService<any, UserRepository> {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly passwordService: UserPasswordService,
    private readonly actionService: UserActionService,
  ) {
    super(userRepo);
  }

  // ── Password & Action Delegates ───────────────────────────────────────────

  async changePassword(id: number | bigint, dto: ChangePasswordDto) {
    return this.passwordService.changePassword(id, dto);
  }

  async syncRelations(userId: number, data: any): Promise<void> {
    return this.actionService.syncRelations(userId, data);
  }

  // ── Lifecycle Hooks ────────────────────────────────────────────────────────

  protected override async prepareFilters(filter: any) {
    const groupFilter = getGroupFilter();
    if (groupFilter.group_id) {
      return { ...filter, groupId: groupFilter.group_id };
    }
    return filter;
  }

  protected override async afterCreate(user: any, data: any): Promise<void> {
    await this.syncRelations(Number(user.id), data);
  }

  protected override async afterUpdate(user: any, data: any): Promise<void> {
    await this.syncRelations(Number(user.id), data);
  }

  protected override async beforeCreate(data: any) {
    const payload = { ...data };
    payload.created_user_id = getCurrentUserId();
    payload.updated_user_id = payload.created_user_id;

    if (payload.password) {
      payload.password = await this.passwordService.hash(payload.password);
    }

    await this.validateUniqueness(payload);

    delete payload.role_ids;
    delete payload.profile;

    return payload;
  }

  async create(data: any) {
    const user = await super.create(data);
    return this.getOne(user.id);
  }

  protected override async beforeUpdate(id: number | bigint, data: any) {
    const payload = { ...data };
    payload.updated_user_id = getCurrentUserId();

    if (payload.password) {
      payload.password = await this.passwordService.hash(payload.password);
    } else {
      delete payload.password;
    }

    await this.validateUniqueness(payload, Number(id));

    delete payload.role_ids;
    delete payload.profile;

    return payload;
  }

  async update(id: number | bigint, data: any) {
    await super.update(id, data);
    return this.getOne(id);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private async validateUniqueness(payload: any, excludeId?: number): Promise<void> {
    const fields = ['email', 'phone', 'username'] as const;
    const labels = {
      email: 'Email',
      phone: 'Số điện thoại',
      username: 'Tên đăng nhập',
    };

    for (const field of fields) {
      if (payload[field]) {
        const isUnique = await this.userRepo.checkUnique(field, payload[field], excludeId);
        if (!isUnique) {
          throw new BadRequestException(`${labels[field]} đã được sử dụng.`);
        }
      }
    }
  }

  protected override transform(user: any) {
    if (!user) return user;
    const u = { ...user } as any;
    const groupId = RequestContext.get<number | null>('groupId');

    if (groupId && u.user_role_assignments) {
      u.role_ids = (u.user_role_assignments as any[])
        .filter((ura: any) => Number(ura.group_id) === Number(groupId))
        .map((ura: any) => Number(ura.role_id));
    } else {
      u.role_ids = u.role_ids || [];
    }

    delete u.user_role_assignments;
    return u;
  }
}

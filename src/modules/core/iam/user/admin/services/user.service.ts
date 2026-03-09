import {
  Injectable,
  NotFoundException,
  Inject,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { RequestContext } from '@/common/shared/utils';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '@/modules/core/iam/user/domain/user.repository';
import { BaseService } from '@/common/core/services';
import { getGroupFilter } from '@/common/shared/utils/group-ownership.util';
import { ChangePasswordDto } from '../dtos/change-password.dto';
import { UserActionService } from './user-action.service';
import { getCurrentUserId } from '@/common/auth/utils/auth-context.helper';

@Injectable()
export class UserService extends BaseService<any, IUserRepository> {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepo: IUserRepository,
    private readonly userActionService: UserActionService,
  ) {
    super(userRepo);
  }

  protected override async prepareFilters(filter: any) {
    const groupFilter = getGroupFilter();
    if (groupFilter.group_id) {
      return { ...filter, groupId: groupFilter.group_id };
    }
    return filter;
  }

  // ── Password Management ────────────────────────────────────────────────────

  async changePassword(id: number | bigint, dto: ChangePasswordDto) {
    const user = await this.verifyUserExistence(id);
    const hashed = await bcrypt.hash(dto.password, 10);
    await this.userRepo.update(id, { password: hashed });
  }

  async userChangePassword(id: number | bigint, oldPassword: string, newPassword: string) {
    const user = await this.userRepo.findByIdForAuth(id);
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');

    if (user.password) {
      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) throw new BadRequestException('Mật khẩu cũ không chính xác');
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.userRepo.update(id, { password: hashed });
  }

  // ── Lifecycle Hooks ────────────────────────────────────────────────────────

  protected override async beforeCreate(data: any) {
    const payload = { ...data };
    payload.created_user_id = getCurrentUserId();
    payload.updated_user_id = payload.created_user_id;

    if (payload.password) {
      payload.password = await bcrypt.hash(payload.password, 10);
    }

    await this.validateUniqueness(payload);

    // Relationships are handled in overridden create()
    delete payload.role_ids;
    delete payload.profile;

    return payload;
  }

  async create(data: any) {
    const user = await super.create(data);
    await this.userActionService.syncRelations(Number(user.id), data);
    return this.getOne(user.id);
  }

  protected override async beforeUpdate(id: number | bigint, data: any) {
    const payload = { ...data };
    payload.updated_user_id = getCurrentUserId();

    if (payload.password) {
      payload.password = await bcrypt.hash(payload.password, 10);
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
    await this.userActionService.syncRelations(Number(id), data);
    return this.getOne(id);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private async verifyUserExistence(id: number | bigint) {
    const user = await this.userRepo.findById(id);
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');
    return user;
  }

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
    const u = this.deepConvertBigInt(user) as any;
    const groupId = RequestContext.get<number | null>('groupId');

    // Filter roles for current group context
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

import { Injectable, Inject } from '@nestjs/common';
import type { PrimaryKey } from '@/common/core/utils/primary-key.util';
import { BaseService } from '@/common/core/services';
import { getCurrentUserId } from '@/common/auth/utils/auth-context.helper';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '@/modules/system/user/domain/user.repository';
import { ChangePasswordDto } from '../dtos/change-password.dto';
import { PasswordService } from './password.service';
import { RelationService } from './relation.service';
import { PolicyService } from './policy.service';
import { UserRoleScopeService } from './user-role-scope.service';

@Injectable()
export class UserService extends BaseService<any, IUserRepository> {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepo: IUserRepository,
    private readonly passwordService: PasswordService,
    private readonly relationService: RelationService,
    private readonly policy: PolicyService,
    private readonly roleScope: UserRoleScopeService,
  ) {
    super(userRepo);
  }

  // ── Password & Action Delegates ────────────────────────────────────────────

  async changePassword(id: PrimaryKey, dto: ChangePasswordDto) {
    await this.policy.assertAccess(id);
    return this.passwordService.changePassword(id, dto);
  }

  // ── Lifecycle Hooks ────────────────────────────────────────────────────────

  protected override async prepareFilters(filter: any) {
    return this.roleScope.mergeListFilter(filter);
  }

  override async getOne(id: PrimaryKey, options: any = {}) {
    await this.policy.assertAccess(id);
    return super.getOne(id, options);
  }

  protected override async beforeCreate(data: any) {
    const payload = { ...data };
    payload.created_user_id = getCurrentUserId();
    payload.updated_user_id = payload.created_user_id;

    if (payload.password) {
      payload.password = await this.passwordService.hash(payload.password);
    }

    await this.policy.assertUnique(payload);

    delete payload.profile;

    return payload;
  }

  protected override async afterCreate(user: any, data: any): Promise<void> {
    await this.relationService.sync(user.id, data);
  }

  protected override async beforeUpdate(id: PrimaryKey, data: any) {
    await this.policy.assertAccess(id);
    const payload = { ...data };
    payload.updated_user_id = getCurrentUserId();

    if (payload.password) {
      payload.password = await this.passwordService.hash(payload.password);
    } else {
      delete payload.password;
    }

    await this.policy.assertUnique(payload, id);

    delete payload.profile;

    return payload;
  }

  protected override async afterUpdate(user: any, data: any): Promise<void> {
    await this.relationService.sync(user.id, data);
  }

  protected override async beforeDelete(id: PrimaryKey): Promise<boolean> {
    await this.policy.assertAccess(id);
    return true;
  }

  // ── Helpers & Transformations ──────────────────────────────────────────────

  protected override transform(user: any) {
    if (!user) return user;
    const { password: _password, ...u } = user;
    return u;
  }
}

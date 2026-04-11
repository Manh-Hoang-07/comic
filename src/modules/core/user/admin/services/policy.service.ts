import { Injectable, ForbiddenException, Inject } from '@nestjs/common';
import { RequestContext } from '@/common/shared/utils';
import { toPrimaryKey } from '@/common/core/repositories/prisma-query.helper';
import { IUserRepository, USER_REPOSITORY } from '@/modules/core/user/domain/user.repository';

export type RoleScope =
  | { kind: 'all' }
  | { kind: 'scoped'; groupIds: any[] }
  | { kind: 'none' };

@Injectable()
export class PolicyService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepo: IUserRepository,
  ) {}

  async assertAccess(userId: any): Promise<void> {
    const context = RequestContext.get<any>('context');
    const groupId = RequestContext.get<any>('groupId');

    if (context?.type === 'system') return;

    if (!context || !groupId) {
      throw new ForbiddenException('No context available');
    }

    const ok = await this.userRepo.exists({
      id: toPrimaryKey(userId),
      user_groups: {
        some: { group_id: toPrimaryKey(groupId) },
      },
    });

    if (!ok) {
      throw new ForbiddenException(
        'Lỗi Context: Bạn không có quyền truy cập người dùng hệ thống khác!',
      );
    }
  }

  /** Phạm vi group cho query role assignments (system vs group). */
  roleScope(raw?: string | any[]): RoleScope {
    let ids =
      typeof raw === 'string'
        ? raw.split(',').filter(Boolean)
        : Array.isArray(raw)
          ? raw
          : undefined;

    const context = RequestContext.get<any>('context');
    const ctxGroupId = RequestContext.get<any>('groupId');

    if (context?.type === 'system') {
      if (!ids?.length) {
        return { kind: 'all' };
      }
      return { kind: 'scoped', groupIds: ids };
    }

    if (!ctxGroupId) {
      throw new ForbiddenException('No context available');
    }

    const ctxPk = toPrimaryKey(ctxGroupId);
    if (ids?.length) {
      const narrowed = ids
        .map((g: any) => toPrimaryKey(g))
        .filter((g: any) => String(g) === String(ctxPk));
      if (!narrowed.length) {
        return { kind: 'none' };
      }
      return { kind: 'scoped', groupIds: narrowed };
    }

    return { kind: 'scoped', groupIds: [ctxGroupId] };
  }

  async assertUnique(payload: any, excludeId?: any): Promise<void> {
    await this.userRepo.checkMultipleUniques(
      {
        email: payload.email,
        phone: payload.phone,
        username: payload.username,
      },
      excludeId,
    );
  }
}

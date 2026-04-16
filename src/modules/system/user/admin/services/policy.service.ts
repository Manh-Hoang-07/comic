import { Injectable, ForbiddenException, Inject } from '@nestjs/common';
import {
  assertReqGroup,
  isSysCtx,
  reqGroupId,
} from '@/common/shared/utils/request-group-context.util';
import { toPrimaryKey } from '@/common/core/repositories/prisma-query.helper';
import type { PrimaryKey } from '@/common/core/utils/primary-key.util';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '@/modules/system/user/domain/user.repository';

export type RoleScope =
  | { kind: 'all' }
  | { kind: 'scoped'; groupIds: PrimaryKey[] }
  | { kind: 'none' };

@Injectable()
export class PolicyService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepo: IUserRepository,
  ) {}

  async assertAccess(userId: PrimaryKey): Promise<void> {
    if (isSysCtx()) return;

    assertReqGroup();
    const groupId = reqGroupId();

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
    const ids =
      typeof raw === 'string'
        ? raw.split(',').filter(Boolean)
        : Array.isArray(raw)
          ? raw
          : undefined;

    if (isSysCtx()) {
      if (!ids?.length) {
        return { kind: 'all' };
      }
      return { kind: 'scoped', groupIds: ids };
    }

    assertReqGroup();
    const ctxGroupId = reqGroupId();
    const ctxPk = toPrimaryKey(ctxGroupId);
    if (ids?.length) {
      const narrowed = ids
        .map((g) => toPrimaryKey(g))
        .filter((g) => String(g) === String(ctxPk));
      if (!narrowed.length) {
        return { kind: 'none' };
      }
      return { kind: 'scoped', groupIds: narrowed };
    }

    return { kind: 'scoped', groupIds: [ctxGroupId] };
  }

  async assertUnique(payload: any, excludeId?: PrimaryKey): Promise<void> {
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

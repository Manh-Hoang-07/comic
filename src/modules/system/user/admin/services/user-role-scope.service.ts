import { ForbiddenException, Injectable, Inject } from '@nestjs/common';
import { getGroupFilter } from '@/common/shared/utils/group-ownership.util';
import {
  assertReqGroup,
  isSysCtx,
  reqGroupId,
} from '@/common/shared/utils/request-group-context.util';
import type { PrimaryKey } from '@/common/core/utils/primary-key.util';
import { toPrimaryKey } from '@/common/core/repositories/prisma-query.helper';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '@/modules/system/user/domain/user.repository';
import {
  GROUP_REPOSITORY,
  IGroupRepository,
} from '@/modules/system/group/domain/group.repository';

/** Nhóm active dùng cho UI role tree (đọc thẳng DB). */
export type RbacUiGroup = {
  id: string;
  code: string;
  type: string;
  name: string;
  status: string;
  contextId: string;
};

/**
 * Phạm vi group/context cho user admin (list filter, role UI, batch sync).
 * Đọc context chung: {@link isSysCtx}, {@link reqGroupId}, {@link assertReqGroup}.
 */
@Injectable()
export class UserRoleScopeService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepo: IUserRepository,
    @Inject(GROUP_REPOSITORY)
    private readonly groupRepo: IGroupRepository,
  ) {}

  /** Gắn điều kiện group cho list user (system: ownership filter, tenant: group hiện tại). */
  mergeListFilter(filter: any): any {
    if (isSysCtx()) {
      return { ...filter, ...getGroupFilter(filter) };
    }
    return { ...filter, groupId: reqGroupId() };
  }

  async resolveRoleUi(targetUserId: PrimaryKey): Promise<{
    groups: RbacUiGroup[];
    assignmentGroupPks: PrimaryKey[];
    /** Hàng group đầy đủ (include context) — dùng cho tree, tránh gọi `findActiveByIds` lần hai. */
    groupRows: any[];
  }> {
    if (isSysCtx()) {
      const memberIds = await this.userRepo.findMemberGroupIds(targetUserId);
      const rows = await this.groupRepo.findActiveByIds(
        memberIds.map((x) => toPrimaryKey(x)),
      );
      return {
        groups: this.mapRowsToUiGroups(rows),
        assignmentGroupPks: memberIds.map((x) => toPrimaryKey(x)),
        groupRows: rows,
      };
    }

    const ctxGroupId = reqGroupId();
    if (ctxGroupId === undefined || ctxGroupId === null) {
      throw new ForbiddenException('No context available');
    }

    const rows = await this.groupRepo.findActiveByIds([
      toPrimaryKey(ctxGroupId),
    ]);
    return {
      groups: this.mapRowsToUiGroups(rows),
      assignmentGroupPks: [toPrimaryKey(ctxGroupId)],
      groupRows: rows,
    };
  }

  guardBatchGroups(items: Array<{ group_id: PrimaryKey }>): void {
    if (isSysCtx()) return;

    assertReqGroup();
    const ctxPk = String(toPrimaryKey(reqGroupId()));
    for (const it of items) {
      if (String(toPrimaryKey(it.group_id)) !== ctxPk) {
        throw new ForbiddenException(
          'group_id is not allowed in the current context',
        );
      }
    }
  }

  private mapRowsToUiGroups(rows: any[]): RbacUiGroup[] {
    return (rows as any[]).map((g) => ({
      id: String(g.id),
      code: g.code,
      type: g.type,
      name: g.name,
      status: g.status,
      contextId: String(g.context_id),
    }));
  }
}

import { Injectable, Inject } from '@nestjs/common';
import {
  IContextRepository,
  CONTEXT_REPOSITORY,
} from '@/modules/system/context/domain/context.repository';
import {
  IGroupRepository,
  GROUP_REPOSITORY,
} from '@/modules/system/group/domain/group.repository';
import {
  IUserGroupRepository,
  USER_GROUP_REPOSITORY,
} from '@/modules/system/rbac/user-group/domain/user-group.repository';
import { toPrimaryKey } from '@/common/core/repositories/prisma-query.helper';
import { SYSTEM_CONTEXT_CODE } from '@/modules/system/rbac/rbac.constants';

@Injectable()
export class UserContextService {
  constructor(
    @Inject(CONTEXT_REPOSITORY)
    private readonly contextRepo: IContextRepository,
    @Inject(GROUP_REPOSITORY)
    private readonly groupRepo: IGroupRepository,
    @Inject(USER_GROUP_REPOSITORY)
    private readonly userGroupRepo: IUserGroupRepository,
  ) {}

  async getUserContexts(userId: any) {
    const userGroups = await this.userGroupRepo.findByUserId(userId);

    if (!userGroups.length) return [];

    const groupIds = Array.from(new Set(userGroups.map((ug) => ug.group_id)));

    const groups = await this.groupRepo.findActiveByIds(groupIds);

    const contextIds = Array.from(new Set(groups.map((g) => g.context_id)));
    if (!contextIds.length) return [];

    const contexts = await this.contextRepo.findActiveByIds(contextIds);

    return contexts.map((ctx) => this.transform(ctx));
  }

  async getUserContextsForTransfer(userId: any) {
    // Look up system context by its code to remain DB agnostic (avoiding hardcoded ID 1)
    const systemContext =
      await this.contextRepo.findByCode(SYSTEM_CONTEXT_CODE);

    const userContexts = await this.getUserContexts(userId);

    const allContexts: any[] = [];
    if (systemContext && systemContext.status === 'active') {
      allContexts.push(this.transform(systemContext));
    }
    allContexts.push(...userContexts);

    // Filter unique by ID
    const uniqueContexts = allContexts.filter(
      (ctx, index, self) =>
        index === self.findIndex((c) => String(c.id) === String(ctx.id)),
    );

    return uniqueContexts;
  }

  private transform(context: any) {
    if (!context) return context;
    return {
      ...context,
      id: toPrimaryKey(context.id),
      ref_id: context.ref_id ? context.ref_id : null,
    };
  }
}

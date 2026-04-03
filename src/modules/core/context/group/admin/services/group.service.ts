import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Inject } from '@nestjs/common';
import { IGroupRepository, GROUP_REPOSITORY } from '@/modules/core/context/group/domain/group.repository';
import { CONTEXT_REPOSITORY, IContextRepository } from '@/modules/core/context/context/domain/context.repository';
import { RbacService } from '@/modules/core/rbac/services/rbac.service';
import { BaseService } from '@/common/core/services';
import { RequestContext } from '@/common/shared/utils';
import { GroupActionService } from './group-action.service';
import { toPrimaryKey } from '@/common/core/repositories/prisma-query.helper';

import { RedisUtil } from '@/core/utils/redis.util';

@Injectable()
export class AdminGroupService extends BaseService<any, IGroupRepository> {
  constructor(
    @Inject(GROUP_REPOSITORY)
    private readonly groupRepo: IGroupRepository,
    @Inject(CONTEXT_REPOSITORY)
    private readonly contextRepo: IContextRepository,
    private readonly rbacService: RbacService,
    private readonly groupAction: GroupActionService,
    private readonly redis: RedisUtil,
  ) {
    super(groupRepo);
  }

  protected defaultSort = 'id:desc';

  // ── Operations ─────────────────────────────────────────────────────────────

  async getOne(id: any): Promise<any> {
    const cacheKey = `ctx:group:${id}`;
    
    // 1. Check Redis cache
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {}
    }

    // 2. Load from DB
    const entity = await this.groupRepo.findById(id);
    if (!entity) throw new NotFoundException(`Group with ID ${id} not found`);

    const transformed = this.transform(entity);
    
    // 3. Cache for 5 minutes (300s)
    await this.redis.set(cacheKey, JSON.stringify(transformed), 300);
    
    return transformed;
  }

  async createGroup(data: any, requesterUserId: any) {
    const context = RequestContext.get<any>('context');
    if (context?.type !== 'system') {
      throw new ForbiddenException('Groups can only be created under the system context');
    }
    return this.create(data);
  }

  async findByCode(code: string) {
    const group = await this.groupRepo.findByCode(code);
    return this.transform(group);
  }

  // ── Lifecycle Hooks ────────────────────────────────────────────────────────

  protected async beforeCreate(data: any) {
    // Validate Context
    const context = await this.contextRepo.findById(data.context_id);
    if (!context || (context as any).status !== 'active') {
      throw new NotFoundException(`Context with id ${data.context_id} not found`);
    }

    // Validate Code Uniqueness
    if (await this.groupRepo.findByCode(data.code)) {
      throw new BadRequestException(`Group with code "${data.code}" already exists`);
    }

    return {
      ...data,
      context_id: toPrimaryKey(data.context_id),
      owner_id: data.owner_id ? toPrimaryKey(data.owner_id) : null,
      status: data.status || 'active',
    };
  }

  protected async afterCreate(group: any) {
    if (group.owner_id) {
      await this.groupAction.syncGroupOwner(group.id, group.owner_id);
    }
  }

  // ── Transformation ─────────────────────────────────────────────────────────

  protected transform(group: any) {
    if (!group) return group;
    const item = super.transform(group) as any;
    if (item.context) {
      item.context = {
        ...item.context,
        id: toPrimaryKey(item.context.id),
        ref_id: item.context.ref_id ? item.context.ref_id : null,
      };
    }
    return item;
  }
}



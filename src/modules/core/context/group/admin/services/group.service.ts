import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Inject } from '@nestjs/common';
import { IGroupRepository, GROUP_REPOSITORY } from '@/modules/core/context/group/domain/group.repository';
import { CONTEXT_REPOSITORY, IContextRepository } from '@/modules/core/context/context/domain/context.repository';
import { RbacService } from '@/modules/core/rbac/services/rbac.service';
import { BaseService } from '@/common/core/services';
import { RequestContext } from '@/common/shared/utils';
import { GroupActionService } from './group-action.service';
import { toPrimaryKey } from '@/common/core/repositories/prisma-query.helper';

import { RedisUtil } from '@/core/utils/redis.util';
import { IPaginationOptions } from '@/common/core/repositories/repository.interface';
import { GroupCatalogService } from '@/modules/core/rbac/catalog/group-catalog.service';

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
    private readonly groupCatalog: GroupCatalogService,
  ) {
    super(groupRepo);
  }

  protected defaultSort = 'id:desc';

  // ── Operations ─────────────────────────────────────────────────────────────
  /**
   * Lightweight snapshot cho middleware (group + context tối thiểu).
   * Tách riêng để middleware không phụ thuộc overload của `getOne`.
   */
  async getContextSnapshot(id: any): Promise<any> {
    return this.getOne(id, 'context');
  }

  /**
   * Override để vẫn tương thích signature `BaseService.getOne(id, _options?: IPaginationOptions)`
   * nhưng bổ sung mode `'context' | 'full'` cho use-cases nội bộ.
   */
  async getOne(id: any, optionsOrMode: IPaginationOptions | 'full' | 'context' = {}): Promise<any> {
    const mode: 'full' | 'context' =
      optionsOrMode === 'context' || optionsOrMode === 'full' ? optionsOrMode : 'full';

    if (mode === 'context') {
      const cacheKey = `ctx:group:snapshot:${id}`;
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        try { return JSON.parse(cached); } catch { }
      }

      const group = await this.groupRepo.findByIdForContext(id);
      if (!group) throw new NotFoundException(`Group with ID ${id} not found`);
      await this.redis.set(cacheKey, JSON.stringify(group), 300);
      return group;
    }

    const cacheKey = `ctx:group:${id}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      try { return JSON.parse(cached); } catch (e) { }
    }

    const entity = await this.groupRepo.findById(id);
    if (!entity) throw new NotFoundException(`Group with ID ${id} not found`);

    const transformed = this.transform(entity);
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
    await this.groupCatalog.refreshAll().catch(() => undefined);
    if (group.owner_id) {
      await this.groupAction.syncGroupOwner(group.id, group.owner_id);
    }
  }

  protected async afterUpdate(): Promise<void> {
    await this.groupCatalog.refreshAll().catch(() => undefined);
  }

  protected async afterDelete(): Promise<void> {
    await this.groupCatalog.refreshAll().catch(() => undefined);
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



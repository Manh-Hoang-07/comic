import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Inject } from '@nestjs/common';
import { IGroupRepository, GROUP_REPOSITORY } from '@/modules/core/context/group/domain/group.repository';
import { CONTEXT_REPOSITORY, IContextRepository } from '@/modules/core/context/context/domain/context.repository';
import { RbacService } from '@/modules/core/rbac/services/rbac.service';
import { BaseService } from '@/common/core/services';
import { GroupActionService } from './group-action.service';

@Injectable()
export class AdminGroupService extends BaseService<any, IGroupRepository> {
  constructor(
    @Inject(GROUP_REPOSITORY)
    private readonly groupRepo: IGroupRepository,
    @Inject(CONTEXT_REPOSITORY)
    private readonly contextRepo: IContextRepository,
    private readonly rbacService: RbacService,
    private readonly groupAction: GroupActionService,
  ) {
    super(groupRepo);
  }

  protected defaultSort = 'id:desc';

  // ── Operations ─────────────────────────────────────────────────────────────

  async isSystemAdmin(userId: number): Promise<boolean> {
    return this.rbacService.isSystemAdmin(userId);
  }

  async createGroup(data: any, requesterUserId: number) {
    const isAdmin = await this.isSystemAdmin(requesterUserId);
    if (!isAdmin) {
      throw new ForbiddenException('Only system admin can create groups');
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
      context_id: BigInt(data.context_id),
      owner_id: data.owner_id ? BigInt(data.owner_id) : null,
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
        id: Number(item.context.id),
        ref_id: item.context.ref_id ? Number(item.context.ref_id) : null,
      };
    }
    return item;
  }
}

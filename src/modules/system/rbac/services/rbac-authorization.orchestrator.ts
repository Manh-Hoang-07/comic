import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { RequestContext } from '@/common/shared/utils';
import { AdminGroupService } from '@/modules/system/group/admin/services/group.service';
import { NullableRbacId } from '@/modules/system/rbac/rbac.types';

/**
 * Một điểm vào cho bước “scope group + context” trước khi check RBAC,
 * để guard không lặp logic và dễ trace khi debug.
 */
@Injectable()
export class RbacAuthorizationOrchestrator {
  private readonly logger = new Logger(RbacAuthorizationOrchestrator.name);

  constructor(private readonly groupService: AdminGroupService) {}

  /**
   * Đọc `groupIdRaw` từ RequestContext (middleware). Không có header → `null` (scope system).
   * Có header → load snapshot, validate active, ghi `groupId` / `context` / `contextId` vào RequestContext.
   */
  async resolveActiveGroupScopeForRbac(): Promise<NullableRbacId> {
    const groupIdRaw = RequestContext.get<unknown>('groupIdRaw') ?? null;
    let groupId: any | null = groupIdRaw ?? null;

    if (groupId === null) {
      return null;
    }

    // Request-level cache to avoid multiple DB/Redis hits in the same request
    const cachedScope = RequestContext.get<NullableRbacId>(
      'resolved_group_scope',
    );
    if (
      cachedScope !== undefined &&
      RequestContext.get('resolved_group_id_raw') === groupIdRaw
    ) {
      return cachedScope;
    }

    let group: Awaited<
      ReturnType<AdminGroupService['getContextSnapshot']>
    > | null;
    try {
      group = await this.groupService.getContextSnapshot(groupId);
    } catch (err) {
      this.logger.warn(
        `Failed to resolve group scope for groupId=${groupId}: ${(err as Error)?.message}`,
      );
      throw new InternalServerErrorException('Failed to resolve group scope');
    }
    if (!group) throw new BadRequestException('Group not found');
    if (!this.isActive(group))
      throw new BadRequestException('Group is inactive');
    if (!group.context || !this.isActive(group.context)) {
      throw new BadRequestException('Context is missing or inactive');
    }

    const contextId = group.context?.id ?? group.context_id ?? null;
    if (!contextId) throw new BadRequestException('Context is invalid');

    RequestContext.set('groupId', group.id ?? groupId);
    RequestContext.set('context', group.context);
    RequestContext.set('contextId', contextId);

    groupId = group.id ?? groupId;

    RequestContext.set('resolved_group_scope', groupId);
    RequestContext.set('resolved_group_id_raw', groupIdRaw);

    return groupId;
  }

  private isActive(entity: { status?: string } | null | undefined): boolean {
    return entity?.status === 'active';
  }
}

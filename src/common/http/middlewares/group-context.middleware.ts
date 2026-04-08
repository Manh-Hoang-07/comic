import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RequestContext } from '@/common/shared/utils';
import { AdminGroupService } from '@/modules/core/context/group/admin/services/group.service';

type CachedGroupContext = {
  expiresAt: number;
  groupId: any;
  context: any;
  contextId: any;
};

@Injectable()
export class GroupContextMiddleware implements NestMiddleware {
  private readonly groupContextCache = new Map<string, CachedGroupContext>();
  private readonly cacheTtlMs = 45_000;

  constructor(
    private readonly groupService: AdminGroupService,
  ) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    const traceRoute = this.isAdminUsersRoute(req);
    const traceStart = traceRoute ? Date.now() : 0;
    const headerGroupId = this.extractGroupId(req);

    if (!headerGroupId) {
      RequestContext.set('groupId', null);
      RequestContext.set('context', null);
      RequestContext.set('contextId', null);
      if (traceStart) {
        RequestContext.set('perf.groupMs', Date.now() - traceStart);
      }
      return next();
    }

    const cached = this.groupContextCache.get(headerGroupId);
    if (cached && cached.expiresAt > Date.now()) {
      RequestContext.set('groupId', cached.groupId);
      RequestContext.set('context', cached.context);
      RequestContext.set('contextId', cached.contextId);
      if (traceStart) {
        RequestContext.set('perf.groupMs', Date.now() - traceStart);
      }
      return next();
    }

    const group = await this.groupService.getOne(headerGroupId).catch(() => null);
    if (!group) throw new BadRequestException('Group not found');
    if (!this.isActive(group)) {
      throw new BadRequestException('Group is inactive');
    }
    if (!group.context || !this.isActive(group.context)) {
      throw new BadRequestException('Context is missing or inactive');
    }
    const contextId = group.context?.id ?? group.context_id ?? null;
    if (!contextId) {
      throw new BadRequestException('Context is invalid');
    }

    const cacheValue: CachedGroupContext = {
      groupId: group.id,
      context: group.context,
      contextId,
      expiresAt: Date.now() + this.cacheTtlMs,
    };

    this.groupContextCache.set(headerGroupId, cacheValue);
    RequestContext.set('groupId', cacheValue.groupId);
    RequestContext.set('context', cacheValue.context);
    RequestContext.set('contextId', cacheValue.contextId);
    if (traceStart) {
      RequestContext.set('perf.groupMs', Date.now() - traceStart);
    }

    return next();
  }

  private extractGroupId(req: Request): string | null {
    const xGroupId = req.headers['x-group-id'];
    const groupId = req.headers['group-id'];
    const legacyGroupId = req.headers['group_id'];
    const raw = xGroupId ?? groupId ?? legacyGroupId ?? null;

    if (Array.isArray(raw)) return raw[0] || null;
    if (typeof raw === 'string' && raw.trim().length > 0) return raw.trim();
    return null;
  }

  private isActive(entity: any): boolean {
    return (entity?.status ?? 'active') === 'active';
  }

  private isAdminUsersRoute(req: Request): boolean {
    const path = (req.originalUrl || req.url || '').split('?')[0];
    return req.method === 'GET' && path.endsWith('/admin/users');
  }
}

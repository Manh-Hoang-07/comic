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
    const requiresStrictGroupContext = this.isAdminPath(req);

    const headerGroupId = this.extractGroupId(req);

    if (!headerGroupId) {
      RequestContext.set('groupId', null);
      RequestContext.set('context', null);
      RequestContext.set('contextId', null);
      return next();
    }

    const cached = this.groupContextCache.get(headerGroupId);
    if (cached && cached.expiresAt > Date.now()) {
      RequestContext.set('groupId', cached.groupId);
      RequestContext.set('context', cached.context);
      RequestContext.set('contextId', cached.contextId);
      return next();
    }

    const group = await this.groupService.getContextSnapshot(headerGroupId).catch(() => null);
    if (!group) {
      if (requiresStrictGroupContext) throw new BadRequestException('Group not found');
      RequestContext.set('groupId', null);
      RequestContext.set('context', null);
      RequestContext.set('contextId', null);
      return next();
    }
    if (!this.isActive(group)) {
      if (requiresStrictGroupContext) throw new BadRequestException('Group is inactive');
      RequestContext.set('groupId', null);
      RequestContext.set('context', null);
      RequestContext.set('contextId', null);
      return next();
    }
    if (!group.context || !this.isActive(group.context)) {
      if (requiresStrictGroupContext) throw new BadRequestException('Context is missing or inactive');
      RequestContext.set('groupId', null);
      RequestContext.set('context', null);
      RequestContext.set('contextId', null);
      return next();
    }
    const contextId = group.context?.id ?? group.context_id ?? null;
    if (!contextId) {
      if (requiresStrictGroupContext) throw new BadRequestException('Context is invalid');
      RequestContext.set('groupId', null);
      RequestContext.set('context', null);
      RequestContext.set('contextId', null);
      return next();
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

  private isAdminPath(req: Request): boolean {
    const rawPath = (req.path || req.originalUrl || '').split('?')[0] || '';
    if (!rawPath) return false;
    const normalizedPath = rawPath.startsWith('/api') ? rawPath.slice(4) || '/' : rawPath;
    return normalizedPath === '/admin' || normalizedPath.startsWith('/admin/');
  }
}

import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RequestContext } from '@/common/shared/utils';
import { CheckpointTracker } from '@/core/logger/checkpoint-tracker';

@Injectable()
export class GroupContextMiddleware implements NestMiddleware {
  async use(req: Request, _res: Response, next: NextFunction) {
    const tracker = RequestContext.get<CheckpointTracker>('tracker');
    tracker?.addCheckpoint('middleware_group_context');

    const headerGroupId = this.extractGroupId(req);

    RequestContext.set('groupIdRaw', headerGroupId);

    if (!headerGroupId) {
      RequestContext.set('groupId', null);
      return next();
    }

    RequestContext.set('groupId', headerGroupId);
    return next();
  }

  private extractGroupId(req: Request): string | null {
    const raw = req.headers['x-group-id'] ?? req.headers['group-id'] ?? null;

    if (Array.isArray(raw)) return raw[0] || null;
    if (typeof raw === 'string' && raw.trim().length > 0) return raw.trim();
    return null;
  }
}

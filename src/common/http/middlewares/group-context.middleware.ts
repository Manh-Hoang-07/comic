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

    if (Array.isArray(raw)) return this.sanitizeGroupId(raw[0]);
    if (typeof raw === 'string') return this.sanitizeGroupId(raw);
    return null;
  }

  private sanitizeGroupId(val: string | undefined): string | null {
    if (!val) return null;
    const trimmed = val.trim();
    if (trimmed.length === 0 || trimmed.length > 36) return null;
    // Only allow numeric or UUID format
    if (!/^[0-9a-f\-]+$/i.test(trimmed)) return null;
    return trimmed;
  }
}

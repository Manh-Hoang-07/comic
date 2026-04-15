import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { RequestContext } from '@/common/shared/utils';
import { CheckpointTracker } from '@/core/logger/checkpoint-tracker';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    RequestContext.run(req, res, () => {
      const tracker = new CheckpointTracker();
      tracker.addCheckpoint('request_entry');

      const method = req.method;
      const url = req.originalUrl || req.url;
      const userAgent = req.get('User-Agent') || '';
      const ip = (
        req.ip ||
        (req.headers['x-forwarded-for'] as string) ||
        req.socket.remoteAddress ||
        ''
      ).toString();

      // Prefer incoming header, else generate
      const ridHeader = req.headers['x-request-id'];
      const requestId = Array.isArray(ridHeader)
        ? (ridHeader[0] as string)
        : typeof ridHeader === 'string' && ridHeader.length > 0
          ? ridHeader
          : randomUUID();

      // Save to per-request store
      RequestContext.set('tracker', tracker);
      RequestContext.set('method', method);
      RequestContext.set('url', url);
      RequestContext.set('userAgent', userAgent);
      RequestContext.set('ip', ip);
      RequestContext.set('requestId', requestId);

      // Reflect request id back to response
      res.setHeader('X-Request-ID', requestId);

      next();
    });
  }
}

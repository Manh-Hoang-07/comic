import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Cache-Control + weak ETag cho GET public API (CDN/browser).
 * Bỏ qua khi có JWT hoặc group header — dữ liệu có thể khác theo user/group.
 */
@Injectable()
export class PublicHttpCacheInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const http = context.switchToHttp();
    const req = http.getRequest();
    const res = http.getResponse();

    if (req.method !== 'GET' || !this.shouldApply(req)) {
      return next.handle();
    }

    const maxAge = Number(process.env.PUBLIC_HTTP_CACHE_MAX_AGE) || 60;
    const sMaxAge = Number(process.env.PUBLIC_HTTP_CACHE_S_MAXAGE) || 300;
    const swr =
      Number(process.env.PUBLIC_HTTP_CACHE_STALE_WHILE_REVALIDATE) || 120;
    const cacheControl = `public, max-age=${maxAge}, s-maxage=${sMaxAge}, stale-while-revalidate=${swr}`;

    return next.handle().pipe(
      map((body) => {
        if (body == null || res.headersSent) {
          return body;
        }
        res.setHeader('Cache-Control', cacheControl);

        const etag = weakEtagFromPayload(body);
        if (etag) {
          res.setHeader('ETag', etag);
        }

        return body;
      }),
    );
  }

  private shouldApply(req: any): boolean {
    if (process.env.PUBLIC_HTTP_CACHE_ENABLED === 'false') {
      return false;
    }
    const path = (req.path || req.url || '').split('?')[0];
    if (!path.includes('/public/')) {
      return false;
    }
    if (req.headers?.authorization) {
      return false;
    }
    const h = req.headers || {};
    if (h['x-group-id'] || h['group-id'] || h['group_id']) {
      return false;
    }
    return true;
  }
}

function weakEtagFromPayload(body: any): string | null {
  if (!body || typeof body !== 'object') {
    return null;
  }
  const envelope =
    body.success === true && body.data !== undefined ? body.data : body;
  let d = envelope;
  if (
    envelope &&
    typeof envelope === 'object' &&
    'data' in envelope &&
    'meta' in envelope
  ) {
    d = envelope.data;
  }
  if (!d || typeof d !== 'object' || Array.isArray(d)) {
    return null;
  }
  const updated = (d as any).updated_at ?? (d as any).updatedAt;
  if (updated == null) {
    return null;
  }
  const t =
    typeof updated === 'string' ? updated : new Date(updated).toISOString();
  const id = (d as any).slug ?? (d as any).id ?? '';
  return `W/"${String(id)}-${t}"`;
}

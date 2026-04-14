import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { Reflector } from '@nestjs/core';
import { CustomLoggerService } from '@/core/logger/logger.service';
import { Auth } from '@/common/auth/utils';
import { LOG_REQUEST_KEY, LogRequestOptions } from '@/common/shared/decorators';
import { extractRequestId, resolveLogTarget } from './logging.helper';
import { RequestContext } from '@/common/shared/utils';
import { CheckpointTracker } from '@/core/logger/checkpoint-tracker';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    private readonly logger: CustomLoggerService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== 'http') return next.handle();

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const isAdmin =
      request.url.includes('/admin/') || request.url.startsWith('/admin');

    // Resolve log config or use default for admin
    const logConfig = this.reflector.getAllAndOverride<LogRequestOptions>(
      LOG_REQUEST_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!logConfig && !isAdmin) return next.handle();

    const tracker = RequestContext.get<CheckpointTracker>('tracker');
    tracker?.addCheckpoint('interceptor_enter');

    const requestId = extractRequestId(request);
    response.setHeader('X-Request-ID', requestId);

    const logTarget = logConfig
      ? resolveLogTarget(request, logConfig)
      : {
          filePath: undefined,
          fileBaseName: isAdmin ? 'admin_access' : undefined,
        };
    const logFileOptions = logTarget.filePath
      ? { filePath: logTarget.filePath }
      : logTarget.fileBaseName
        ? { fileBaseName: logTarget.fileBaseName }
        : undefined;

    const user = Auth.user(context);
    const baseContext = {
      context: 'HTTP',
      requestId,
      method: request.method,
      url: request.url,
      userAgent: request.get('User-Agent') || '',
      ip: request.ip,
      userId: Auth.id(context),
      username: user?.username || user?.email || null,
      extra: {
        params: hasKeys(request.params) ? request.params : undefined,
        query: hasKeys(request.query) ? request.query : undefined,
        bodySize: parseInt(request.get('content-length') || '0', 10) || 0,
      },
    } as const;

    const startTime = Date.now();
    tracker?.addCheckpoint('controller_start');

    return next.handle().pipe(
      tap(() => {
        tracker?.addCheckpoint('controller_end');
        const duration = Date.now() - startTime;
        this.logger.log(
          isAdmin ? `Admin API Call: ${baseContext.url}` : 'Outgoing Response',
          {
            ...baseContext,
            extra: {
              ...baseContext.extra,
              statusCode: response.statusCode,
              durationMs: duration,
              timings: tracker?.toLogDetails(),
            },
          },
          logFileOptions,
        );
      }),
      catchError((error) => {
        tracker?.addCheckpoint('controller_error');
        const duration = Date.now() - startTime;
        this.logger.error(
          isAdmin ? `Admin API Error: ${baseContext.url}` : 'Error Response',
          error?.stack,
          {
            ...baseContext,
            extra: {
              ...baseContext.extra,
              statusCode: (error as any)?.status || 500,
              durationMs: duration,
              errorMessage: error?.message,
              timings: tracker?.toLogDetails(),
            },
          },
          logFileOptions,
        );
        throw error;
      }),
    );
  }
}

function hasKeys(obj: object | undefined): boolean {
  return !!obj && Object.keys(obj).length > 0;
}

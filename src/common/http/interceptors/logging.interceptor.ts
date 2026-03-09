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

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    private readonly logger: CustomLoggerService,
    private readonly reflector: Reflector,
  ) { }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== 'http') return next.handle();

    // Only log when the route has @LogRequest()
    const logConfig = this.reflector.getAllAndOverride<LogRequestOptions>(
      LOG_REQUEST_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!logConfig) return next.handle();

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const requestId = extractRequestId(request);
    response.setHeader('X-Request-ID', requestId);

    const logTarget = resolveLogTarget(request, logConfig);
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

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        this.logger.log(
          'Outgoing Response',
          {
            ...baseContext,
            extra: {
              ...baseContext.extra,
              statusCode: response.statusCode,
              durationMs: duration,
            },
          },
          logFileOptions,
        );
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        this.logger.error(
          'Error Response',
          error?.stack,
          {
            ...baseContext,
            extra: {
              ...baseContext.extra,
              statusCode: (error as any)?.status || 500,
              durationMs: duration,
              errorMessage: error?.message,
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

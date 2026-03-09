import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ResponseUtil } from '@/common/shared/utils';
import { sanitizeHeaders, sanitizeBody } from './request-sanitizer';

/** URL paths that generate constant 404s (browsers, crawlers) — suppress log noise. */
const IGNORED_404_PATHS = [
  '/favicon.ico',
  '/.well-known/appspecific/com.chrome.devtools.json',
  '/robots.txt',
];

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // Already in ApiResponse format → send directly
    if (isApiResponseFormat(exceptionResponse)) {
      response.status(status).json(exceptionResponse);
      return;
    }

    const { message, errors } = extractErrorDetails(exception, exceptionResponse);

    if (this.shouldLog(status, request.url)) {
      this.logger.error(
        `HTTP ${status} – ${message}`,
        JSON.stringify({
          path: request.url,
          method: request.method,
          ip: request.ip,
          userAgent: request.get('User-Agent'),
          body: sanitizeBody(request.body),
          params: request.params,
          query: request.query,
          headers: sanitizeHeaders(request.headers as Record<string, any>),
          timestamp: new Date().toISOString(),
        }),
        exception.stack,
      );
    }

    response.status(status).json(ResponseUtil.error(message, 'ERROR', status, errors));
  }

  private shouldLog(status: number, url: string): boolean {
    if (status !== HttpStatus.NOT_FOUND) return true;
    return !IGNORED_404_PATHS.some((path) => url.includes(path));
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isApiResponseFormat(res: any): boolean {
  return (
    res !== null &&
    typeof res === 'object' &&
    'success' in res &&
    'code' in res &&
    'timestamp' in res
  );
}

function extractErrorDetails(
  exception: HttpException,
  exceptionResponse: string | object,
): { message: string; errors: any } {
  let message = exception.message;
  let errors: any = null;

  if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
    const errorObj = exceptionResponse as Record<string, any>;
    message = errorObj.message || message;
    errors = errorObj.errors || errorObj.error || null;

    // class-validator sends an array of messages
    if (Array.isArray(errorObj.message)) {
      message =
        errorObj.message.length > 0 ? errorObj.message[0] : 'Validation failed';
      errors = errorObj.message;
    }
  }

  return { message, errors };
}

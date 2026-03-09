import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ResponseUtil } from '@/common/shared/utils';
import { mapExceptionToResponse } from './exception-mapper.helper';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, any> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((raw) => this.handleSuccess(raw)),
      catchError((err) => this.handleError(err)),
    );
  }

  private handleSuccess(raw: any): any {
    // If it's already an ApiResponse format (e.g. from manual ResponseUtil.success), return as-is
    if (isApiResponse(raw)) return raw;

    // Handle paginated results from BaseService
    if (raw && typeof raw === 'object' && 'data' in raw && 'meta' in raw) {
      const { data, meta } = raw;
      // Convert internal meta to external PaginationMeta if needed
      return ResponseUtil.paginated(
        data,
        meta.page || meta.currentPage || 1,
        meta.limit || meta.itemsPerPage || 10,
        meta.totalItems || 0,
      );
    }

    return ResponseUtil.success(raw);
  }

  private handleError(err: any): Observable<never> {
    // If it's already in the standard error format, just rethrow
    if (isApiResponse(err?.response)) {
      return throwError(() => err);
    }

    const { message, code, status, errors } = mapExceptionToResponse(err);
    const apiError = ResponseUtil.error(message, code, status, errors);

    // We keep it as an error to be handled by the Global Filter if necessary, 
    // but formatted as an ApiResponse
    return throwError(() => ({
      ...err,
      response: apiError,
      status: apiError.httpStatus,
    }));
  }
}

function isApiResponse(obj: any): boolean {
  return obj && typeof obj === 'object' && 'success' in obj && 'timestamp' in obj;
}

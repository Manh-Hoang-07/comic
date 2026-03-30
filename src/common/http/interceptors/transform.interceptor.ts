import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ResponseUtil } from '@/common/shared/utils';
import { deepConvertBigInt } from '@/common/shared/utils/bigint-converter';
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
    // 1. Transform BigInt values to Number globally
    const safeData = deepConvertBigInt(raw);

    // 2. If it's already an ApiResponse format, return as-is
    if (isApiResponse(safeData)) return safeData;

    // 3. Handle paginated results
    if (safeData && typeof safeData === 'object' && 'data' in safeData && 'meta' in safeData) {
      const { data, meta } = safeData;
      return ResponseUtil.paginated(
        data,
        meta.page || meta.currentPage || 1,
        meta.limit || meta.itemsPerPage || 10,
        meta.totalItems || 0,
      );
    }

    return ResponseUtil.success(safeData);
  }

  private handleError(err: any): Observable<never> {
    if (isApiResponse(err?.response)) {
      return throwError(() => err);
    }

    const { message, code, status, errors } = mapExceptionToResponse(err);
    const apiError = ResponseUtil.error(message, code, status, errors);

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


import { HttpStatus, Injectable } from '@nestjs/common';
import { formatResponseTimestamp } from './response-timestamp.helper';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  code: string;
  httpStatus: number;
  data: T | null;
  meta: object;
  timestamp: string;
}

export interface PaginationMeta {
  currentPage: number;
  itemCount: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

@Injectable() // Optional, static methods don't technically need it but keeps Nest style
export class ResponseUtil {
  /** Create a generic success response (200 OK by default). */
  static success<T>(
    data?: T,
    message = 'Success',
    code = 'SUCCESS',
    httpStatus = HttpStatus.OK,
    meta?: object,
  ): ApiResponse<T> {
    return {
      success: true,
      message,
      code,
      httpStatus,
      data: data ?? null,
      meta: meta ?? {},
      timestamp: formatResponseTimestamp(),
    };
  }

  /** Create an error response with custom code and status. */
  static error(
    message = 'Error',
    code = 'ERROR',
    httpStatus = HttpStatus.BAD_REQUEST,
    errors?: any,
  ): ApiResponse<null> {
    return {
      success: false,
      message,
      code,
      httpStatus,
      data: null,
      meta: errors ?? {},
      timestamp: formatResponseTimestamp(),
    };
  }

  /** Create a paginated response with calculated metadata. */
  static paginated<T>(
    data: T[],
    currentPage: number,
    itemsPerPage: number,
    totalItems: number,
    message = 'Success',
    code = 'SUCCESS',
  ): ApiResponse<T[]> {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const meta: PaginationMeta = {
      currentPage,
      itemCount: data.length,
      itemsPerPage,
      totalItems,
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
    };

    return this.success(data, message, code, HttpStatus.OK, meta);
  }

  // ── Success Aliases ────────────────────────────────────────────────────────

  static created<T>(data?: T, message = 'Created'): ApiResponse<T> {
    return this.success(data, message, 'CREATED', HttpStatus.CREATED);
  }

  static updated<T>(data?: T, message = 'Updated'): ApiResponse<T> {
    return this.success(data, message, 'UPDATED', HttpStatus.OK);
  }

  static deleted(message = 'Deleted'): ApiResponse<null> {
    return this.success(null, message, 'DELETED', HttpStatus.OK);
  }

  // ── Error Aliases ──────────────────────────────────────────────────────────

  static notFound(message = 'Not found'): ApiResponse<null> {
    return this.error(message, 'NOT_FOUND', HttpStatus.NOT_FOUND);
  }

  static validationError(errors: any, message = 'Validation failed'): ApiResponse<null> {
    return this.error(message, 'VALIDATION_ERROR', HttpStatus.BAD_REQUEST, errors);
  }

  static forbidden(message = 'Forbidden'): ApiResponse<null> {
    return this.error(message, 'FORBIDDEN', HttpStatus.FORBIDDEN);
  }

  static unauthorized(message = 'Unauthorized'): ApiResponse<null> {
    return this.error(message, 'UNAUTHORIZED', HttpStatus.UNAUTHORIZED);
  }

  static badRequest(message = 'Bad request', errors?: any): ApiResponse<null> {
    return this.error(message, 'BAD_REQUEST', HttpStatus.BAD_REQUEST, errors);
  }

  static internalServerError(message = 'Internal server error'): ApiResponse<null> {
    return this.error(message, 'INTERNAL_SERVER_ERROR', HttpStatus.INTERNAL_SERVER_ERROR);
  }

  static conflict(message = 'Conflict'): ApiResponse<null> {
    return this.error(message, 'CONFLICT', HttpStatus.CONFLICT);
  }

  static tooManyRequests(message = 'Too many requests'): ApiResponse<null> {
    return this.error(message, 'TOO_MANY_REQUESTS', HttpStatus.TOO_MANY_REQUESTS);
  }

  static invalidQuery(message = 'Invalid query parameters'): ApiResponse<null> {
    return this.error(message, 'INVALID_QUERY', HttpStatus.BAD_REQUEST);
  }

  /** Universal transform for any data structure into ApiResponse. */
  static transform<T>(
    data: T,
    success = true,
    message?: string,
    code?: string,
    httpStatus?: number,
    meta?: object,
  ): ApiResponse<T> {
    return {
      success,
      message: message || (success ? 'Success' : 'Error'),
      code: code || (success ? 'SUCCESS' : 'ERROR'),
      httpStatus: httpStatus || (success ? HttpStatus.OK : HttpStatus.BAD_REQUEST),
      data: success ? data : null,
      meta: meta || {},
      timestamp: formatResponseTimestamp(),
    };
  }
}

// ── Standalone Utility exports for easy access without the Class ─────────────
export const success = ResponseUtil.success;
export const error = ResponseUtil.error;

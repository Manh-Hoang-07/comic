import { Request } from 'express';
import { LogRequestOptions } from '@/common/shared/decorators';

/**
 * Generate a unique request ID.
 * Prefers crypto.randomUUID() when available; falls back to Math.random().
 */
export function generateRequestId(): string {
    const uid =
        typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID().replace(/-/g, '').substring(0, 9)
            : Math.random().toString(36).substring(2, 11);
    return `req_${Date.now()}_${uid}`;
}

/**
 * Extract the request ID from the `x-request-id` header.
 * Returns the first value if the header is an array.
 */
export function extractRequestId(request: Request): string {
    const raw = request.headers['x-request-id'];
    if (Array.isArray(raw)) return raw[0] || generateRequestId();
    if (typeof raw === 'string' && raw.length > 0) return raw;
    return generateRequestId();
}

export interface ResolvedLogTarget {
    filePath?: string;
    fileBaseName?: string;
}

/**
 * Determine which log file to write to, with the following priority:
 * 1. `x-log-file` request header (absolute path)
 * 2. `filePath` from the @LogRequest() decorator
 * 3. `x-log-base-name` request header
 * 4. `fileBaseName` from the @LogRequest() decorator
 * 5. Default base name `'api-requests'`
 */
export function resolveLogTarget(
    request: Request,
    logConfig: LogRequestOptions,
): ResolvedLogTarget {
    const filePathHeader = request.headers['x-log-file'] as string | undefined;
    if (filePathHeader) return { filePath: filePathHeader };
    if (logConfig.filePath) return { filePath: logConfig.filePath };

    const baseNameHeader = request.headers['x-log-base-name'] as string | undefined;
    if (baseNameHeader) return { fileBaseName: baseNameHeader };
    if (logConfig.fileBaseName) return { fileBaseName: logConfig.fileBaseName };

    return { fileBaseName: 'api-requests' };
}

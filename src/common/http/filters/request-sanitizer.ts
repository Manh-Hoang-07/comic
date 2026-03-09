/**
 * Sensitive header names to redact from logs.
 */
const SENSITIVE_HEADERS = ['authorization', 'cookie', 'x-api-key'];

/**
 * Sensitive body field names to redact from logs.
 */
const SENSITIVE_BODY_KEYS = [
    'password',
    'currentPassword',
    'newPassword',
    'confirmPassword',
    'token',
    'accessToken',
    'refreshToken',
    'authorization',
];

/**
 * Remove sensitive header values for log output.
 * Returns a shallow copy with sensitive headers replaced by '[REDACTED]'.
 */
export function sanitizeHeaders(headers: Record<string, any>): Record<string, any> {
    const sanitized = { ...headers };
    for (const name of SENSITIVE_HEADERS) {
        if (sanitized[name]) sanitized[name] = '[REDACTED]';
    }
    return sanitized;
}

/**
 * Mask sensitive fields in a request body for log output.
 * - Sensitive keys → '[REDACTED]'
 * - Nested objects → '[OBJECT]'  (shallow)
 * - Primitive values → kept as-is
 */
export function sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') return body;

    const clone: Record<string, any> = Array.isArray(body) ? [] : {};
    for (const key of Object.keys(body)) {
        if (SENSITIVE_BODY_KEYS.includes(key)) {
            clone[key] = '[REDACTED]';
        } else {
            const val = (body as Record<string, any>)[key];
            clone[key] = val && typeof val === 'object' ? '[OBJECT]' : val;
        }
    }
    return clone;
}

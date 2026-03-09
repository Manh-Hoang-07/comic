import * as jwt from 'jsonwebtoken';

/**
 * Decode a Bearer token from the `Authorization` header value.
 * Returns null if the header is missing or malformed.
 */
export function extractBearerToken(authHeader: string | undefined): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.substring(7).trim();
    return token.length > 0 ? token : null;
}

/**
 * Check if a JWT has already expired by decoding without verification.
 * Returns true only when the `exp` claim is present AND is in the past.
 * Returns false on any error (treat as not-expired to let Passport handle it).
 */
export function isJwtExpired(token: string): boolean {
    try {
        const decoded = jwt.decode(token, { complete: true });
        if (!decoded || typeof decoded !== 'object' || !decoded.payload) return false;

        const payload = decoded.payload as jwt.JwtPayload;
        if (!payload.exp) return false;

        const exp = typeof payload.exp === 'number' ? payload.exp : parseInt(payload.exp, 10);
        return exp < Math.floor(Date.now() / 1000);
    } catch {
        return false;
    }
}

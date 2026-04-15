/**
 * Decode a Bearer token from the `Authorization` header value.
 * Returns null if the header is missing or malformed.
 */
export function extractBearerToken(
  authHeader: string | undefined,
): string | null {
  if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) return null;
  const token = authHeader.substring(7).trim();
  return token.length > 0 ? token : null;
}

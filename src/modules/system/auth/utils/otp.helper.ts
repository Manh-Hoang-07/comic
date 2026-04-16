/**
 * Generate a random 6-digit OTP string.
 */
export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generate a standardized Redis key for OTP storage.
 * @param type - Purpose of the OTP (e.g., 'register', 'forgot-password')
 * @param email - Target user email
 */
export function buildOtpKey(type: string, email: string): string {
  return `otp:${type}:${email.toLowerCase()}`;
}

/**
 * Check if the provided OTP matches the cached one, with development bypass.
 */
export function isValidOtp(
  provided: string,
  cached: string | null | undefined,
): boolean {
  if (!cached) return false;

  // Normal verification
  if (provided === cached) return true;

  // Development bypass
  const isDevEnv = process.env.NODE_ENV === 'development';
  if (isDevEnv && provided === '123456') return true;

  return false;
}

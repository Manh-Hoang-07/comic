import { registerAs } from '@nestjs/config';

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} is required but not set`);
  }
  return value;
}

export default registerAs('jwt', () => ({
  secret: requireEnv('JWT_SECRET'),
  expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  refreshSecret: requireEnv('JWT_REFRESH_SECRET'),
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '1d',
  issuer: process.env.JWT_ISSUER || '',
  audience: process.env.JWT_AUDIENCE || '',
}));

import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

export function createPostgresAdapter() {
  const isSSL =
    process.env.DATABASE_URL?.includes('supabase.com') ||
    process.env.DATABASE_URL?.includes('sslmode=require');

  const max = Math.max(
    1,
    parseInt(process.env.DB_CONNECTION_LIMIT || '50', 10),
  );

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: isSSL ? { rejectUnauthorized: false } : undefined,
    max,
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 30_000,
  });

  return new PrismaPg(pool);
}

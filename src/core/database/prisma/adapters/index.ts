import { createPostgresAdapter } from './postgresql.adapter';
import { createMySqlAdapter } from './mysql.adapter';

export { createPostgresAdapter, createMySqlAdapter };

export type DbProvider = 'postgresql' | 'mysql';

export function detectProvider(): DbProvider {
  const url = process.env.DATABASE_URL || '';
  if (
    url.startsWith('mysql://') ||
    url.startsWith('mysql2://') ||
    url.startsWith('mariadb://')
  ) {
    return 'mysql';
  }
  return 'postgresql';
}

const adapterMap: Record<
  DbProvider,
  () => ReturnType<typeof createMySqlAdapter | typeof createPostgresAdapter>
> = {
  mysql: createMySqlAdapter,
  postgresql: createPostgresAdapter,
};

export function createAdapter(provider: DbProvider) {
  return adapterMap[provider]();
}

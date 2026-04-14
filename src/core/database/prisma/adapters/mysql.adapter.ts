import { PrismaMariaDb } from '@prisma/adapter-mariadb';

export function createMySqlAdapter() {
  // PrismaMariaDb auto-converts mysql:// → mariadb:// and creates its own pool
  return new PrismaMariaDb(process.env.DATABASE_URL!);
}

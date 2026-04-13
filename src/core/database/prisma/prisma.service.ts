import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const isSSL = process.env.DATABASE_URL?.includes('supabase.com') || process.env.DATABASE_URL?.includes('sslmode=require');
    const max = Math.max(1, parseInt(process.env.DB_CONNECTION_LIMIT || '50', 10));
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: isSSL ? { rejectUnauthorized: false } : undefined,
      max,
      connectionTimeoutMillis: 10_000,
      idleTimeoutMillis: 30_000,
    });
    const adapter = new PrismaPg(pool as any);
    super({
      adapter,
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'error' },
        { emit: 'stdout', level: 'warn' },
      ],
    });

    // Option to log query details
    (this as any).$on('query', (e: any) => {
      this.logger.log(`[SQL] ${e.query} | Params: ${e.params} | Duration: ${e.duration}ms`);
    });
  }

  async onModuleInit() {
    await this.$connect();
    // Pre-warm connection pool to avoid 400ms delay on first request
    await this.$queryRaw`SELECT 1`.catch(() => undefined);
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

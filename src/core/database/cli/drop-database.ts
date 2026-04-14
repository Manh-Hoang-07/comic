import 'reflect-metadata';
import { config } from 'dotenv';
import * as path from 'path';
import { Logger } from '@nestjs/common';
import { Client } from 'pg';
import { parse } from 'pg-connection-string';

async function bootstrap() {
  const logger = new Logger('DropDatabaseCLI');

  // Load environment variables từ file .env
  config({ path: path.resolve(process.cwd(), '.env') });

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    logger.error('DATABASE_URL is not defined in .env');
    process.exit(1);
  }

  const configParams = parse(connectionString);
  const databaseName = configParams.database;

  if (!databaseName) {
    logger.error('Database name not found in DATABASE_URL');
    process.exit(1);
  }

  // Create a connection without specifying the database to connect to 'postgres' server
  const client = new Client({
    user: configParams.user,
    host: configParams.host || 'localhost',
    database: 'postgres',
    password: configParams.password,
    port: configParams.port ? parseInt(configParams.port, 10) : 5432,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    logger.log(
      `Connected to PostgreSQL server at ${configParams.host || 'localhost'}`,
    );

    // Check if database exists
    const res = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [databaseName],
    );

    const dbExists = res.rowCount !== null && res.rowCount > 0;

    if (dbExists) {
      // Drop database - PostgreSQL doesn't allow dropping the database you're connected to,
      // but we're connected to 'postgres' so it's fine.
      // We also need to terminate other connections to that DB first in a real scenario,
      // but for CLI this should be enough.
      await client.query(`DROP DATABASE "${databaseName}"`);
      logger.log(`✅ Database '${databaseName}' dropped successfully.`);
    } else {
      logger.log(`Database '${databaseName}' does not exist. Skipping drop.`);
    }

    await client.end();
    process.exit(0);
  } catch (error) {
    logger.error(`❌ Failed to drop database '${databaseName}':`, error);
    process.exit(1);
  }
}

bootstrap();

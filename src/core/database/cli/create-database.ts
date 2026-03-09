import 'reflect-metadata';
import { config } from 'dotenv';
import * as path from 'path';
import { Client } from 'pg';
import { parse } from 'pg-connection-string';

// Load environment variables từ file .env
config({ path: path.resolve(process.cwd(), '.env') });

async function createDatabaseIfNotExists() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    process.exit(1);
  }

  const config = parse(connectionString);
  const dbName = config.database;

  // Connect to 'postgres' default database to create the new one
  const client = new Client({
    user: config.user,
    host: config.host || 'localhost',
    database: 'postgres',
    password: config.password,
    port: config.port ? parseInt(config.port, 10) : 5432,
    ssl: { rejectUnauthorized: false }
  });


  try {
    await client.connect();

    // Check if database exists
    const res = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [dbName]
    );

    if (res.rowCount === 0) {
      // Create database
      await client.query(`CREATE DATABASE "${dbName}"`);
    }

    await client.end();
    process.exit(0);
  } catch (error: any) {
    process.exit(1);
  }
}


createDatabaseIfNotExists();


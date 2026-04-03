const { Client } = require('pg');
const Redis = require('ioredis');

// ===== CONFIG =====
const PG_URL = 'postgresql://postgres.ykbfuxfqbozfnablyvqc:kIkhU5awEgnldznL@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres?pgbouncer=true';
const REDIS_URL = 'rediss://default:gQAAAAAAAVCsAAIncDExNzAzNDU4MTc3Mjg0ZmYxOTc1YWViNDk5MzljOTU2NHAxODYxODg@crack-monitor-86188.upstash.io:6379';

// ===== INIT =====
const pgClient = new Client({
  connectionString: PG_URL,
  ssl: { rejectUnauthorized: false },
});

const redis = new Redis(REDIS_URL);

// ===== HELPER =====
async function measure(label, fn) {
  const start = Date.now();
  await fn();
  const end = Date.now();
  console.log(`${label}: ${end - start} ms`);
}

// ===== TEST =====
async function runTest() {
  await pgClient.connect();
  console.log('Connected DB & Redis\n');

  const LOOP = 10;

  // ===== PostgreSQL test =====
  for (let i = 0; i < LOOP; i++) {
    await measure(`Postgres query ${i + 1}`, async () => {
      await pgClient.query('SELECT 1');
    });
  }

  console.log('\n----------------------\n');

  // ===== Redis SET =====
  for (let i = 0; i < LOOP; i++) {
    await measure(`Redis SET ${i + 1}`, async () => {
      await redis.set(`test_key_${i}`, `value_${i}`);
    });
  }

  console.log('\n----------------------\n');

  // ===== Redis GET =====
  for (let i = 0; i < LOOP; i++) {
    await measure(`Redis GET ${i + 1}`, async () => {
      await redis.get(`test_key_${i}`);
    });
  }

  await pgClient.end();
  redis.disconnect();
}

runTest();
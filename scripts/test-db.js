const { Pool } = require('pg');
require('dotenv').config();

async function testConnection() {
    const start = Date.now();
    console.log('Connecting to database...');

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const connectStart = Date.now();
        const client = await pool.connect();
        console.log(`Connection established in ${Date.now() - connectStart}ms`);

        const queryStart = Date.now();
        const res = await client.query('SELECT 1');
        console.log(`First query executed in ${Date.now() - queryStart}ms`);

        client.release();
        console.log(`Total time: ${Date.now() - start}ms`);
    } catch (err) {
        console.error('Connection error:', err);
    } finally {
        await pool.end();
    }
}

testConnection();

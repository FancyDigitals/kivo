import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.js';

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('⚠️ DATABASE_URL is not set in environment variables');
}

const globalForDb = globalThis;

// Enable SSL for Neon Cloud Database with auto-reconnect pool
const pool =
  globalForDb.pgPool ||
  new Pool({
    connectionString,
    ssl: connectionString && !connectionString.includes('localhost')
      ? { rejectUnauthorized: false }
      : false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
});

if (process.env.NODE_ENV !== 'production') {
  globalForDb.pgPool = pool;
}

export const db = drizzle(pool, { schema });
export default db;
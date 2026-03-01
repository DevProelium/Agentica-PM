import pg from 'pg';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

const { Pool } = pg;

const pool = new Pool({
  host:     env.POSTGRES_HOST,
  port:     env.POSTGRES_PORT,
  database: env.POSTGRES_DB,
  user:     env.POSTGRES_USER,
  password: env.POSTGRES_PASSWORD,
  max:      20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Slow query logging (> 1 s)
pool.on('connect', client => {
  client.on('notice', msg => logger.debug('pg notice: ' + msg.message));
});

pool.on('error', err => {
  logger.error('Unexpected pg pool error', { err: err.message });
});

/**
 * Execute a query with optional slow-query logging.
 */
export async function query(text, params) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    if (duration > 1000) {
      logger.warn('Slow query detected', { duration, query: text });
    }
    return result;
  } catch (err) {
    logger.error('Database query error', { err: err.message, query: text });
    throw err;
  }
}

/**
 * Get a client from the pool for transactions.
 */
export async function getClient() {
  return pool.connect();
}

/**
 * Run a function inside a transaction. Rolls back on error.
 */
export async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Connect with retry (useful at startup).
 */
export async function connectWithRetry(retries = 10, delay = 2000) {
  for (let i = 1; i <= retries; i++) {
    try {
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      logger.info('PostgreSQL connected');
      return;
    } catch (err) {
      logger.warn(`PostgreSQL connection attempt ${i}/${retries} failed`, { err: err.message });
      if (i === retries) throw err;
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

export default pool;

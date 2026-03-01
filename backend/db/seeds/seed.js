import { query } from '../../src/config/database.js';
import { logger } from '../../src/utils/logger.js';
import bcrypt from 'bcryptjs';

export default async function seed() {
  try {
    // Create demo user
    const hash = await bcrypt.hash('demo1234', 12);
    const { rows } = await query(
      `INSERT INTO users (username, email, password_hash, coins, gems)
       VALUES ('demo', 'demo@crisalida.app', $1, 500, 10)
       ON CONFLICT (email) DO NOTHING RETURNING id`,
      [hash]
    );

    if (rows[0]) {
      const userId = rows[0].id;
      // Create demo agent
      await query(
        `INSERT INTO agents (user_id, name, personality, model_provider, model_name)
         VALUES ($1, 'Lumina', 'curious and creative', 'ollama', 'llama3')
         ON CONFLICT DO NOTHING`,
        [userId]
      );
      logger.info('Seed: demo user and agent created');
    } else {
      logger.info('Seed: demo user already exists');
    }
  } catch (err) {
    logger.error('Seed failed', { err: err.message });
    throw err;
  }
}

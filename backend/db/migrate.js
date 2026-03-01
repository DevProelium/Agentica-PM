import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { query } from '../src/config/database.js';
import { logger } from '../src/utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default async function migrate() {
  try {
    const schema = readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await query(schema);
    logger.info('Migration complete');
  } catch (err) {
    logger.error('Migration failed', { err: err.message });
    throw err;
  }
}

import { env } from '../config/env.js';

// Minimal logger using console – replaces winston for zero-dep simplicity.
const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const current = LEVELS[env.LOG_LEVEL] ?? 2;

function log(level, message, meta) {
  if (LEVELS[level] > current) return;
  const entry = {
    ts:    new Date().toISOString(),
    level,
    message,
    ...(meta || {}),
  };
  const out = JSON.stringify(entry);
  if (level === 'error' || level === 'warn') {
    process.stderr.write(out + '\n');
  } else {
    process.stdout.write(out + '\n');
  }
}

export const logger = {
  error: (msg, meta) => log('error', msg, meta),
  warn:  (msg, meta) => log('warn',  msg, meta),
  info:  (msg, meta) => log('info',  msg, meta),
  debug: (msg, meta) => log('debug', msg, meta),
};

export default logger;

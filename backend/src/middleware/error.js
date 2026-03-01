import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

/**
 * Central error handler. Must have 4 params to be picked up by Express.
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';

  logger.error('Request error', {
    method: req.method,
    url:    req.originalUrl,
    status,
    err:    message,
    stack:  env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  res.status(status).json({
    error:   message,
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

/**
 * Create a typed HTTP error.
 */
export function createError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

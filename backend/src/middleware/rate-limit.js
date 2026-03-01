/**
 * Re-export express-rate-limit as a named export for consistent usage across routes.
 */
import { rateLimit as _rateLimit } from 'express-rate-limit';

/**
 * @param {object} opts
 * @param {number} opts.windowMs  - Time window in ms
 * @param {number} opts.max       - Max requests per window
 */
export function rateLimit({ windowMs = 60_000, max = 60 } = {}) {
  return _rateLimit({
    windowMs,
    limit: max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests' },
  });
}

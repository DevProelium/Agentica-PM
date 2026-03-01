/**
 * Shared utility functions used by both backend and frontend.
 */

/**
 * Clamp a value between min and max.
 */
export function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

/**
 * Deep clone a plain object.
 */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Format a timestamp as a human-readable relative string.
 */
export function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/**
 * Generate a short random ID (not cryptographically secure – use UUID for persistence).
 */
export function shortId(len = 8) {
  return Math.random().toString(36).slice(2, 2 + len);
}

/**
 * Sleep for ms milliseconds.
 */
export function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

/**
 * Truncate text to maxLen characters.
 */
export function truncate(text, maxLen = 100) {
  if (!text || text.length <= maxLen) return text;
  return text.slice(0, maxLen) + '…';
}

/**
 * Calculate XP needed for the next level.
 */
export function xpForLevel(level) {
  return level * 100;
}

/**
 * Calculate percentage progress to next level.
 */
export function levelProgress(xp, level) {
  const needed = xpForLevel(level);
  return Math.min(100, Math.round((xp / needed) * 100));
}

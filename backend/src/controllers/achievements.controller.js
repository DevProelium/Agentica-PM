import { query } from '../config/database.js';

export async function list(req, res, next) {
  try {
    const { rows } = await query(
      'SELECT * FROM achievements ORDER BY name ASC'
    );
    res.json(rows);
  } catch (err) { next(err); }
}

export async function mine(req, res, next) {
  try {
    const { rows } = await query(
      `SELECT a.*, ua.unlocked_at
       FROM achievements a
       JOIN user_achievements ua ON ua.achievement_id = a.id
       WHERE ua.user_id=$1
       ORDER BY ua.unlocked_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) { next(err); }
}

/**
 * Internal: unlock an achievement for a user and grant rewards.
 */
export async function unlockAchievement(userId, achievementKey) {
  const { rows } = await query('SELECT * FROM achievements WHERE key=$1', [achievementKey]);
  if (!rows[0]) return;
  const ach = rows[0];

  const { rowCount } = await query(
    `INSERT INTO user_achievements (user_id, achievement_id)
     VALUES ($1,$2) ON CONFLICT DO NOTHING`,
    [userId, ach.id]
  );

  if (rowCount > 0 && ach.reward_coins > 0) {
    await query('UPDATE users SET coins=coins+$1 WHERE id=$2', [ach.reward_coins, userId]);
  }
  return rowCount > 0 ? ach : null;
}

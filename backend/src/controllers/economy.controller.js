import { query } from '../config/database.js';

export async function balance(req, res, next) {
  try {
    const { rows } = await query(
      'SELECT coins, gems FROM users WHERE id=$1',
      [req.user.id]
    );
    res.json(rows[0] || { coins: 0, gems: 0 });
  } catch (err) { next(err); }
}

export async function transactions(req, res, next) {
  try {
    const limit  = Math.min(parseInt(req.query.limit || '20'), 100);
    const offset = parseInt(req.query.offset || '0');
    const { rows } = await query(
      `SELECT id, type, currency, amount, description, created_at
       FROM transactions WHERE user_id=$1
       ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );
    res.json(rows);
  } catch (err) { next(err); }
}

export async function dailyReward(req, res, next) {
  try {
    // Grant only once per 20 hours
    const { rows } = await query(
      `SELECT created_at FROM transactions
       WHERE user_id=$1 AND description='Daily reward'
       ORDER BY created_at DESC LIMIT 1`,
      [req.user.id]
    );
    if (rows[0]) {
      const last = new Date(rows[0].created_at);
      if (Date.now() - last.getTime() < 20 * 60 * 60 * 1000) {
        return res.status(429).json({ error: 'Daily reward already claimed' });
      }
    }

    const amount = 50;
    await query('UPDATE users SET coins=coins+$1 WHERE id=$2', [amount, req.user.id]);
    await query(
      `INSERT INTO transactions (user_id,type,currency,amount,description)
       VALUES ($1,'reward','coins',$2,'Daily reward')`,
      [req.user.id, amount]
    );

    const { rows: u } = await query('SELECT coins, gems FROM users WHERE id=$1', [req.user.id]);
    res.json({ message: 'Daily reward claimed', coins: amount, balance: u[0] });
  } catch (err) { next(err); }
}

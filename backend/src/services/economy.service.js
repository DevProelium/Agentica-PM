import { query } from '../config/database.js';

export class EconomyService {
  async getBalance(userId) {
    const { rows } = await query(
      `SELECT crystals, lifetime_earned, lifetime_spent FROM users WHERE id=$1`,
      [userId]
    );
    return rows[0] || { crystals: 0, lifetimeEarned: 0, lifetimeSpent: 0 };
  }

  async award(userId, { amount, reason, sourceType, sourceId }) {
    // Anti-farm: check daily limits
    const now = new Date();
    const since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const { rows } = await query(
      `SELECT SUM(amount) AS total, COUNT(*) AS count FROM transactions
       WHERE user_id=$1 AND source_type=$2 AND source_id=$3 AND created_at > $4`,
      [userId, sourceType, sourceId, since]
    );
    let limit = 0, diminishing = [10,8,6,4,2,0];
    switch (sourceType) {
      case 'pet':        limit = 50;  break;
      case 'chat':       limit = 100; break;
      case 'feed_md':    limit = 200; break;
      case 'game_complete':
      case 'achievement': limit = Infinity; break;
    }
    if (rows[0]?.total >= limit) return { awarded: 0 };
    let actual = amount;
    if (sourceType === 'pet') {
      actual = diminishing[Math.min(rows[0]?.count || 0, diminishing.length-1)];
      if (actual <= 0) return { awarded: 0 };
    }
    await query(
      `INSERT INTO transactions (user_id, amount, reason, source_type, source_id, created_at)
       VALUES ($1,$2,$3,$4,$5,NOW())`,
      [userId, actual, reason, sourceType, sourceId]
    );
    await query(
      `UPDATE users SET crystals=crystals+$1, lifetime_earned=lifetime_earned+$1 WHERE id=$2`,
      [actual, userId]
    );
    return { awarded: actual };
  }

  async spend(userId, { amount, reason, itemType, itemId }) {
    const { rows } = await query(`SELECT crystals FROM users WHERE id=$1`, [userId]);
    if (!rows[0] || rows[0].crystals < amount) throw new Error('InsufficientFundsError');
    await query(
      `UPDATE users SET crystals=crystals-$1, lifetime_spent=lifetime_spent+$1 WHERE id=$2`,
      [amount, userId]
    );
    await query(
      `INSERT INTO transactions (user_id, amount, reason, item_type, item_id, created_at)
       VALUES ($1,-$2,$3,$4,$5,NOW())`,
      [userId, amount, reason, itemType, itemId]
    );
    return { crystals: rows[0].crystals - amount };
  }

  async getTransactions(userId, limit = 20) {
    const { rows } = await query(
      `SELECT * FROM transactions WHERE user_id=$1 ORDER BY created_at DESC LIMIT $2`,
      [userId, limit]
    );
    return rows;
  }
}

export default new EconomyService();

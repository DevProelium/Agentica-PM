import { query, withTransaction } from '../config/database.js';

export async function list(req, res, next) {
  try {
    const { category, rarity } = req.query;
    let sql = 'SELECT * FROM store_items WHERE is_active=TRUE';
    const params = [];
    if (category) { params.push(category); sql += ` AND category=$${params.length}`; }
    if (rarity)   { params.push(rarity);   sql += ` AND rarity=$${params.length}`; }
    sql += ' ORDER BY price_coins ASC';
    const { rows } = await query(sql, params);
    res.json(rows);
  } catch (err) { next(err); }
}

export async function getItem(req, res, next) {
  try {
    const { rows } = await query('SELECT * FROM store_items WHERE id=$1 AND is_active=TRUE', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Item not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
}

export async function purchase(req, res, next) {
  try {
    const { itemId } = req.body;
    if (!itemId) return res.status(400).json({ error: 'itemId required' });

    await withTransaction(async client => {
      const { rows: items } = await client.query(
        'SELECT * FROM store_items WHERE id=$1 AND is_active=TRUE FOR UPDATE',
        [itemId]
      );
      if (!items[0]) throw Object.assign(new Error('Item not found'), { status: 404 });
      const item = items[0];

      const { rows: users } = await client.query(
        'SELECT coins, gems FROM users WHERE id=$1 FOR UPDATE',
        [req.user.id]
      );
      const user = users[0];

      if (item.price_gems > 0) {
        if (user.gems < item.price_gems) throw Object.assign(new Error('Not enough gems'), { status: 402 });
        await client.query('UPDATE users SET gems=gems-$1 WHERE id=$2', [item.price_gems, req.user.id]);
      } else {
        if (user.coins < item.price_coins) throw Object.assign(new Error('Not enough coins'), { status: 402 });
        await client.query('UPDATE users SET coins=coins-$1 WHERE id=$2', [item.price_coins, req.user.id]);
      }

      await client.query(
        `INSERT INTO inventory (user_id, item_id) VALUES ($1,$2)
         ON CONFLICT (user_id, item_id) DO UPDATE SET quantity=inventory.quantity+1`,
        [req.user.id, itemId]
      );

      await client.query(
        `INSERT INTO transactions (user_id,type,currency,amount,description,reference_id)
         VALUES ($1,'purchase',$2,$3,$4,$5)`,
        [
          req.user.id,
          item.price_gems > 0 ? 'gems' : 'coins',
          -(item.price_gems || item.price_coins),
          `Purchased: ${item.name}`,
          itemId,
        ]
      );

      res.status(201).json({ message: 'Purchase successful', item });
    });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
}

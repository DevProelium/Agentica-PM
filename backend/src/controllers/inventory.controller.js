import { query } from '../config/database.js';

export async function list(req, res, next) {
  try {
    const { rows } = await query(
      `SELECT i.id, i.quantity, i.acquired_at,
              s.id AS item_id, s.name, s.description, s.category,
              s.asset_key, s.preview_url, s.rarity
       FROM inventory i
       JOIN store_items s ON s.id = i.item_id
       WHERE i.user_id=$1 ORDER BY i.acquired_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) { next(err); }
}

export async function equip(req, res, next) {
  try {
    const { agentId, itemId, slot } = req.body;
    if (!agentId || !itemId || !slot) {
      return res.status(400).json({ error: 'agentId, itemId, slot required' });
    }

    // Verify ownership
    const { rows: inv } = await query(
      'SELECT * FROM inventory WHERE user_id=$1 AND item_id=$2',
      [req.user.id, itemId]
    );
    if (!inv[0]) return res.status(404).json({ error: 'Item not in inventory' });

    // Map slot to agent column
    const slotMap = { skin: 'current_skin', environment: 'current_env' };
    const col     = slotMap[slot];
    if (!col) return res.status(400).json({ error: `Unknown slot: ${slot}` });

    const { rows: items } = await query('SELECT asset_key FROM store_items WHERE id=$1', [itemId]);
    const assetKey = items[0]?.asset_key || itemId;

    const { rows } = await query(
      `UPDATE agents SET ${col}=$1, updated_at=NOW()
       WHERE id=$2 AND user_id=$3 RETURNING *`,
      [assetKey, agentId, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Agent not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
}

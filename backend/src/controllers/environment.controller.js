import { query } from '../config/database.js';
import agentService from '../services/agent.service.js';

export async function getEnvironment(req, res, next) {
  try {
    const { agentId } = req.params;
    const agent = await agentService.getById(agentId, req.user.id);
    if (!agent) return res.status(404).json({ error: 'Agent not found' });

    const { rows } = await query(
      'SELECT * FROM environments WHERE agent_id=$1',
      [agentId]
    );
    res.json(rows[0] || {});
  } catch (err) { next(err); }
}

export async function updateEnvironment(req, res, next) {
  try {
    const { agentId } = req.params;
    const agent = await agentService.getById(agentId, req.user.id);
    if (!agent) return res.status(404).json({ error: 'Agent not found' });

    const { roomKey, lighting, wallpaper, floor } = req.body;
    const { rows } = await query(
      `UPDATE environments SET
         room_key  = COALESCE($1, room_key),
         lighting  = COALESCE($2::jsonb, lighting),
         wallpaper = COALESCE($3, wallpaper),
         floor     = COALESCE($4, floor),
         updated_at = NOW()
       WHERE agent_id=$5 RETURNING *`,
      [roomKey, lighting ? JSON.stringify(lighting) : null, wallpaper, floor, agentId]
    );
    res.json(rows[0]);
  } catch (err) { next(err); }
}

export async function addFurniture(req, res, next) {
  try {
    const { agentId } = req.params;
    const agent = await agentService.getById(agentId, req.user.id);
    if (!agent) return res.status(404).json({ error: 'Agent not found' });

    const piece = req.body;
    const { rows } = await query(
      `UPDATE environments
       SET furniture = furniture || $1::jsonb, updated_at=NOW()
       WHERE agent_id=$2 RETURNING *`,
      [JSON.stringify([piece]), agentId]
    );
    res.json(rows[0]);
  } catch (err) { next(err); }
}

export async function removeFurniture(req, res, next) {
  try {
    const { agentId, furnitureId } = req.params;
    const agent = await agentService.getById(agentId, req.user.id);
    if (!agent) return res.status(404).json({ error: 'Agent not found' });

    // Filter out furniture item by id
    const { rows } = await query(
      `UPDATE environments
       SET furniture = (
         SELECT jsonb_agg(elem)
         FROM jsonb_array_elements(furniture) elem
         WHERE elem->>'id' != $1
       ),
       updated_at=NOW()
       WHERE agent_id=$2 RETURNING *`,
      [furnitureId, agentId]
    );
    res.json(rows[0]);
  } catch (err) { next(err); }
}

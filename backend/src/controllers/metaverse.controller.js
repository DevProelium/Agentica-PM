import { query } from '../config/database.js';

export async function listRooms(req, res, next) {
  try {
    const { rows } = await query(
      `SELECT id, name, room_type, max_players, is_active, created_at
       FROM metaverse_rooms WHERE is_active=TRUE ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (err) { next(err); }
}

export async function createRoom(req, res, next) {
  try {
    const { name, roomType = 'public', maxPlayers = 20, sceneConfig = {} } = req.body;
    const { rows } = await query(
      `INSERT INTO metaverse_rooms (owner_id, name, room_type, max_players, scene_config)
       VALUES ($1,$2,$3,$4,$5::jsonb) RETURNING *`,
      [req.user.id, name, roomType, maxPlayers, JSON.stringify(sceneConfig)]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
}

export async function getRoom(req, res, next) {
  try {
    const { rows } = await query(
      'SELECT * FROM metaverse_rooms WHERE id=$1 AND is_active=TRUE',
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Room not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
}

export async function getRoomAgents(req, res, next) {
  try {
    // Return agents whose owners are active in this room (simplified)
    const { rows } = await query(
      `SELECT a.id, a.name, a.current_skin, a.level
       FROM agents a
       WHERE a.is_alive=TRUE LIMIT 20`
    );
    res.json(rows);
  } catch (err) { next(err); }
}

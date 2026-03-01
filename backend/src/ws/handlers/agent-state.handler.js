import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { sendToUser } from '../broadcaster.js';
import { query }      from '../../config/database.js';

/**
 * Verify a WS JWT token. Returns user payload or null.
 */
export function authenticate(token) {
  if (!token) return null;
  try {
    return jwt.verify(token, env.JWT_SECRET);
  } catch {
    return null;
  }
}

/**
 * Push the latest agent state to the user.
 */
export async function pushAgentState(userId, agentId) {
  const { rows } = await query(
    `SELECT id,name,hunger,happiness,energy,hygiene,social,xp,level,is_alive,
            current_skin,current_env,last_tick_at
     FROM agents WHERE id=$1 AND user_id=$2`,
    [agentId, userId]
  );
  if (rows[0]) {
    sendToUser(userId, 'agent:state', rows[0]);
  }
}

import agentService from '../services/agent.service.js';
import { query }    from '../config/database.js';

export async function sendMessage(req, res, next) {
  try {
    const { agentId } = req.params;
    const { content }  = req.body;
    const result = await agentService.chat(agentId, req.user.id, content);
    res.json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
}

export async function history(req, res, next) {
  try {
    const { agentId } = req.params;
    const limit  = Math.min(parseInt(req.query.limit  || '50'), 200);
    const offset = parseInt(req.query.offset || '0');

    const { rows } = await query(
      `SELECT id, role, content, tokens, created_at
       FROM chat_messages
       WHERE agent_id=$1 AND user_id=$2
       ORDER BY created_at ASC
       LIMIT $3 OFFSET $4`,
      [agentId, req.user.id, limit, offset]
    );
    res.json(rows);
  } catch (err) { next(err); }
}

export async function clearHistory(req, res, next) {
  try {
    const { agentId } = req.params;
    await query(
      'DELETE FROM chat_messages WHERE agent_id=$1 AND user_id=$2',
      [agentId, req.user.id]
    );
    res.json({ message: 'History cleared' });
  } catch (err) { next(err); }
}

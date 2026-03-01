import agentService from '../services/agent.service.js';
import { query }    from '../config/database.js';

export async function feed(req, res, next) {
  try {
    const { itemId } = req.body;
    let foodItem = null;
    if (itemId) {
      const { rows } = await query('SELECT * FROM store_items WHERE id=$1 AND category=$2', [itemId, 'food']);
      foodItem = rows[0];
    }
    const agent = await agentService.feed(req.params.agentId, req.user.id, foodItem);
    if (!agent) return res.status(404).json({ error: 'Agent not found' });
    res.json(agent);
  } catch (err) { next(err); }
}

export async function play(req, res, next) {
  try {
    const agent = await agentService.play(req.params.agentId, req.user.id);
    if (!agent) return res.status(404).json({ error: 'Agent not found' });
    res.json(agent);
  } catch (err) { next(err); }
}

export async function sleep(req, res, next) {
  try {
    const agent = await agentService.sleep(req.params.agentId, req.user.id);
    if (!agent) return res.status(404).json({ error: 'Agent not found' });
    res.json(agent);
  } catch (err) { next(err); }
}

export async function clean(req, res, next) {
  try {
    const agent = await agentService.clean(req.params.agentId, req.user.id);
    if (!agent) return res.status(404).json({ error: 'Agent not found' });
    res.json(agent);
  } catch (err) { next(err); }
}

export async function status(req, res, next) {
  try {
    const agent = await agentService.getById(req.params.agentId, req.user.id);
    if (!agent) return res.status(404).json({ error: 'Agent not found' });
    const { hunger, happiness, energy, hygiene, social, xp, level, is_alive } = agent;
    res.json({ hunger, happiness, energy, hygiene, social, xp, level, is_alive });
  } catch (err) { next(err); }
}

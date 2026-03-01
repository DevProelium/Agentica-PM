import agentService from '../services/agent.service.js';

export async function list(req, res, next) {
  try {
    const agents = await agentService.listByUser(req.user.id);
    res.json(agents);
  } catch (err) { next(err); }
}

export async function getOne(req, res, next) {
  try {
    const agent = await agentService.getById(req.params.id, req.user.id);
    if (!agent) return res.status(404).json({ error: 'Agent not found' });
    res.json(agent);
  } catch (err) { next(err); }
}

export async function create(req, res, next) {
  try {
    const agent = await agentService.create(req.user.id, req.body);
    res.status(201).json(agent);
  } catch (err) { next(err); }
}

export async function update(req, res, next) {
  try {
    const agent = await agentService.update(req.params.id, req.user.id, req.body);
    if (!agent) return res.status(404).json({ error: 'Agent not found' });
    res.json(agent);
  } catch (err) { next(err); }
}

export async function remove(req, res, next) {
  try {
    const deleted = await agentService.delete(req.params.id, req.user.id);
    if (!deleted) return res.status(404).json({ error: 'Agent not found' });
    res.json({ message: 'Agent deleted' });
  } catch (err) { next(err); }
}

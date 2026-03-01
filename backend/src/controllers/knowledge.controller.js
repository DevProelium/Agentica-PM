import { query }      from '../config/database.js';
import agentService   from '../services/agent.service.js';
import { uploadFile } from '../config/minio.js';
import { logger }     from '../utils/logger.js';

export async function list(req, res, next) {
  try {
    const { agentId } = req.params;
    const { rows } = await query(
      `SELECT id, title, source_url, file_key, created_at
       FROM knowledge_items WHERE agent_id=$1 ORDER BY created_at DESC`,
      [agentId]
    );
    res.json(rows);
  } catch (err) { next(err); }
}

export async function add(req, res, next) {
  try {
    const { agentId }               = req.params;
    const { title, content, sourceUrl } = req.body;

    // Verify agent ownership
    const agent = await agentService.getById(agentId, req.user.id);
    if (!agent) return res.status(404).json({ error: 'Agent not found' });

    let fileKey = null;
    let textContent = content || '';

    if (req.file) {
      fileKey     = `knowledge/${agentId}/${Date.now()}-${req.file.originalname}`;
      textContent = req.file.buffer.toString('utf8');
      await uploadFile(fileKey, req.file.buffer, req.file.mimetype);
    }

    // Generate embedding if connector supports it
    let embedding = null;
    try {
      const connector = await agentService.getConnector(agent);
      const vec = await connector.embed(textContent.slice(0, 8000));
      embedding = `[${vec.join(',')}]`;
    } catch (e) {
      logger.warn('Embedding failed, storing without vector', { err: e.message });
    }

    const { rows } = await query(
      `INSERT INTO knowledge_items (agent_id, title, content, embedding, source_url, file_key)
       VALUES ($1,$2,$3,$4::vector,$5,$6) RETURNING *`,
      [agentId, title, textContent, embedding, sourceUrl || null, fileKey]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
}

export async function remove(req, res, next) {
  try {
    const { agentId, id } = req.params;
    const agent = await agentService.getById(agentId, req.user.id);
    if (!agent) return res.status(403).json({ error: 'Forbidden' });
    await query('DELETE FROM knowledge_items WHERE id=$1 AND agent_id=$2', [id, agentId]);
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
}

export async function search(req, res, next) {
  try {
    const { agentId } = req.params;
    const { query: searchQuery } = req.body;
    const agent = await agentService.getById(agentId, req.user.id);
    if (!agent) return res.status(404).json({ error: 'Agent not found' });
    try {
      const connector = await agentService.getConnector(agent);
      const embedding = await connector.embed(searchQuery);
      const results   = await agentService.searchKnowledge(agentId, embedding);
      res.json(results);
    } catch {
      // Fallback: full-text search
      const { rows } = await query(
        `SELECT id, title, content, created_at FROM knowledge_items
         WHERE agent_id=$1 AND (title ILIKE $2 OR content ILIKE $2)
         LIMIT 10`,
        [agentId, `%${searchQuery}%`]
      );
      res.json(rows);
    }
  } catch (err) { next(err); }
}

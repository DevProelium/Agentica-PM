import { query, withTransaction } from '../config/database.js';
import { createConnector }        from '../connectors/connector-factory.js';
import { logger }                 from '../utils/logger.js';
import soulService                from './soul.service.js';
import environmentService         from './environment.service.js';

export class AgentService {
  // ── Retrieval ───────────────────────────────────────────────

  async getById(agentId, userId) {
    const { rows } = await query(
      'SELECT * FROM agents WHERE id = $1 AND user_id = $2',
      [agentId, userId]
    );
    
    const agent = rows[0];
    if (agent) {
      // Inyectar el "Alma" dinámica de los archivos MD si están disponibles
      const soulPrompt = await soulService.loadSoulAsPrompt(agent.name.toLowerCase());
      if (soulPrompt) {
        agent.systemPrompt = soulPrompt;
        logger.info(`[AgentService] Dynamic soul injected for agent: ${agent.name}`);
      }
    }
    
    return agent || null;
  }

  async listByUser(userId) {
    const { rows } = await query(
      'SELECT * FROM agents WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return rows;
  }

  // ── Creation ────────────────────────────────────────────────

  async create(userId, data) {
    const apiKeyEnc = data.apiKey ? Buffer.from(data.apiKey).toString('base64') : null;

    const { rows } = await query(
      `INSERT INTO agents
         (user_id, name, personality, model_provider, model_name, api_key_enc, system_prompt)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [
        userId,
        data.name,
        data.personality || 'friendly',
        data.modelProvider || 'openai',
        data.modelName     || 'gpt-4o-mini',
        apiKeyEnc,
        data.systemPrompt  || null,
      ]
    );

    // Create default environment
    await query(
      'INSERT INTO environments (agent_id) VALUES ($1) ON CONFLICT DO NOTHING',
      [rows[0].id]
    );

    return rows[0];
  }

  // ── Update ──────────────────────────────────────────────────

  async update(agentId, userId, data) {
    const agent = await this.getById(agentId, userId);
    if (!agent) return null;

    const apiKeyEnc = data.apiKey
      ? Buffer.from(data.apiKey).toString('base64')
      : agent.api_key_enc;

    const { rows } = await query(
      `UPDATE agents SET
         name=$1, personality=$2, model_provider=$3, model_name=$4,
         api_key_enc=$5, system_prompt=$6, avatar_url=$7, updated_at=NOW()
       WHERE id=$8 AND user_id=$9
       RETURNING *`,
      [
        data.name          ?? agent.name,
        data.personality   ?? agent.personality,
        data.modelProvider ?? agent.model_provider,
        data.modelName     ?? agent.model_name,
        apiKeyEnc,
        data.systemPrompt  ?? agent.system_prompt,
        data.avatarUrl     ?? agent.avatar_url,
        agentId,
        userId,
      ]
    );
    return rows[0] || null;
  }

  // ── Delete ──────────────────────────────────────────────────

  async delete(agentId, userId) {
    const { rowCount } = await query(
      'DELETE FROM agents WHERE id=$1 AND user_id=$2',
      [agentId, userId]
    );
    return rowCount > 0;
  }

  // ── Chat ────────────────────────────────────────────────────

  async chat(agentId, userId, userMessage) {
    const agent = await this.getById(agentId, userId);
    if (!agent) throw Object.assign(new Error('Agent not found'), { status: 404 });
    if (!agent.is_alive) throw Object.assign(new Error('Agent is not alive'), { status: 400 });

    const connector = createConnector(agent.model_provider, agent.model_name, agent.api_key_enc);

    // Fetch recent conversation context (last 20 messages)
    const { rows: history } = await query(
      `SELECT role, content FROM chat_messages
       WHERE agent_id=$1 ORDER BY created_at DESC LIMIT 20`,
      [agentId]
    );
    const contextMessages = history.reverse();

    // Build system prompt
    let systemPrompt = agent.systemPrompt || 
      `You are ${agent.name}, a ${agent.personality} AI companion.`;

    // Inyectar percepción del entorno (quién está cerca, qué hay)
    // Buscamos si el agente está en alguna sala (esto se llenaría vía Websockets en tiempo real)
    const perception = environmentService.getPerceptionPrompt('lobby'); // lobby por defecto para pruebas
    systemPrompt += `\n\n${perception}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...contextMessages,
      { role: 'user',   content: userMessage },
    ];

    const response = await connector.chat(messages);

    // Persist both messages
    await withTransaction(async client => {
      await client.query(
        'INSERT INTO chat_messages (agent_id,user_id,role,content,tokens) VALUES ($1,$2,$3,$4,$5)',
        [agentId, userId, 'user', userMessage, 0]
      );
      await client.query(
        'INSERT INTO chat_messages (agent_id,user_id,role,content,tokens) VALUES ($1,$2,$3,$4,$5)',
        [agentId, userId, 'assistant', response.content, response.tokens]
      );
      // Increase happiness slightly for social interaction
      await client.query(
        `UPDATE agents SET happiness=LEAST(100,happiness+2), social=LEAST(100,social+3),
         xp=xp+5, updated_at=NOW() WHERE id=$1`,
        [agentId]
      );
    });

    return { content: response.content, tokens: response.tokens };
  }

  // ── Stats tick ──────────────────────────────────────────────

  async tickStats(agentId) {
    const { rows } = await query(
      `UPDATE agents SET
         hunger   = GREATEST(0, hunger   - 5),
         energy   = GREATEST(0, energy   - 3),
         hygiene  = GREATEST(0, hygiene  - 2),
         happiness = CASE
           WHEN hunger < 20 OR energy < 20 THEN GREATEST(0, happiness - 5)
           ELSE GREATEST(0, happiness - 1)
         END,
         last_tick_at = NOW(),
         updated_at   = NOW()
       WHERE id = $1
       RETURNING *`,
      [agentId]
    );
    return rows[0];
  }

  // ── Care actions ────────────────────────────────────────────

  async feed(agentId, userId, foodItem) {
    const agent = await this.getById(agentId, userId);
    if (!agent) return null;
    const boost = foodItem?.hunger_boost || 20;
    const { rows } = await query(
      `UPDATE agents SET
         hunger=LEAST(100, hunger+$1),
         happiness=LEAST(100, happiness+5),
         xp=xp+10, last_fed_at=NOW(), updated_at=NOW()
       WHERE id=$2 AND user_id=$3 RETURNING *`,
      [boost, agentId, userId]
    );
    return rows[0];
  }

  async play(agentId, userId) {
    const { rows } = await query(
      `UPDATE agents SET
         happiness=LEAST(100, happiness+15),
         energy=GREATEST(0, energy-10),
         social=LEAST(100, social+10),
         xp=xp+20, updated_at=NOW()
       WHERE id=$1 AND user_id=$2 RETURNING *`,
      [agentId, userId]
    );
    return rows[0];
  }

  async sleep(agentId, userId) {
    const { rows } = await query(
      `UPDATE agents SET
         energy=LEAST(100, energy+40),
         hygiene=LEAST(100, hygiene+5),
         xp=xp+5, updated_at=NOW()
       WHERE id=$1 AND user_id=$2 RETURNING *`,
      [agentId, userId]
    );
    return rows[0];
  }

  async clean(agentId, userId) {
    const { rows } = await query(
      `UPDATE agents SET
         hygiene=LEAST(100, hygiene+30),
         happiness=LEAST(100, happiness+10),
         xp=xp+15, updated_at=NOW()
       WHERE id=$1 AND user_id=$2 RETURNING *`,
      [agentId, userId]
    );
    return rows[0];
  }

  // ── Embedding ────────────────────────────────────────────────

  async getConnector(agent) {
    return createConnector(agent.model_provider, agent.model_name, agent.api_key_enc);
  }

  // ── Knowledge RAG ────────────────────────────────────────────

  async searchKnowledge(agentId, embedding, limit = 5) {
    const embeddingStr = `[${embedding.join(',')}]`;
    const { rows } = await query(
      `SELECT id, title, content,
         1 - (embedding <=> $1::vector) AS similarity
       FROM knowledge_items
       WHERE agent_id=$2 AND embedding IS NOT NULL
       ORDER BY embedding <=> $1::vector
       LIMIT $3`,
      [embeddingStr, agentId, limit]
    );
    return rows;
  }

  // ── Level up ─────────────────────────────────────────────────

  async checkLevelUp(agentId) {
    const { rows } = await query('SELECT id, xp, level FROM agents WHERE id=$1', [agentId]);
    if (!rows[0]) return;
    const { xp, level } = rows[0];
    const xpNeeded = level * 100;
    if (xp >= xpNeeded) {
      await query(
        'UPDATE agents SET level=level+1, xp=xp-$1 WHERE id=$2',
        [xpNeeded, agentId]
      );
      logger.info(`Agent ${agentId} leveled up to ${level + 1}`);
    }
  }
}

export default new AgentService();

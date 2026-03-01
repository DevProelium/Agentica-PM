import { query }        from '../config/database.js';
import agentService     from '../services/agent.service.js';
import { env }          from '../config/env.js';
import { logger }       from '../utils/logger.js';

let tickTimer    = null;
let behaviorTimer = null;

/**
 * Tick loop: decay agent stats for all alive agents.
 */
async function tickLoop() {
  try {
    const { rows: agents } = await query(
      `SELECT id FROM agents WHERE is_alive=TRUE`
    );
    logger.debug(`Worker tick: processing ${agents.length} agents`);
    for (const agent of agents) {
      try {
        const updated = await agentService.tickStats(agent.id);
        // Kill agent if critical stats hit zero
        if (updated && updated.hunger === 0 && updated.energy === 0) {
          await query(
            'UPDATE agents SET is_alive=FALSE, updated_at=NOW() WHERE id=$1',
            [agent.id]
          );
          logger.warn(`Agent ${agent.id} died from neglect`);
        }
        await agentService.checkLevelUp(agent.id);
      } catch (err) {
        logger.error(`Tick error for agent ${agent.id}`, { err: err.message });
      }
    }
  } catch (err) {
    logger.error('Tick loop error', { err: err.message });
  }
}

/**
 * Behavior loop: generate autonomous agent actions/thoughts.
 */
async function behaviorLoop() {
  try {
    const { rows: agents } = await query(
      `SELECT a.*, u.id AS owner_id
       FROM agents a JOIN users u ON u.id = a.user_id
       WHERE a.is_alive=TRUE LIMIT 50`
    );
    for (const agent of agents) {
      try {
        await generateBehavior(agent);
      } catch (err) {
        logger.error(`Behavior error for agent ${agent.id}`, { err: err.message });
      }
    }
  } catch (err) {
    logger.error('Behavior loop error', { err: err.message });
  }
}

async function generateBehavior(agent) {
  // Simple rule-based autonomous behavior
  if (agent.hunger < 30) {
    await query(
      `INSERT INTO chat_messages (agent_id,user_id,role,content)
       VALUES ($1,$2,'assistant',$3)`,
      [agent.id, agent.user_id, `*${agent.name} feels hungry and looks around for food...*`]
    );
  } else if (agent.happiness < 40) {
    await query(
      `INSERT INTO chat_messages (agent_id,user_id,role,content)
       VALUES ($1,$2,'assistant',$3)`,
      [agent.id, agent.user_id, `*${agent.name} seems a bit lonely and sighs quietly.*`]
    );
  } else if (agent.energy < 20) {
    await query(
      `INSERT INTO chat_messages (agent_id,user_id,role,content)
       VALUES ($1,$2,'assistant',$3)`,
      [agent.id, agent.user_id, `*${agent.name} yawns and looks sleepy.*`]
    );
  }
}

/**
 * Daily reward check: grant daily login coins to active users.
 */
async function dailyAgenda() {
  try {
    await query(
      `UPDATE users SET coins=coins+10, updated_at=NOW()
       WHERE id IN (
         SELECT DISTINCT user_id FROM agents WHERE last_tick_at > NOW()-INTERVAL '24 hours'
       )`
    );
    logger.info('Daily agenda: distributed daily coins');
  } catch (err) {
    logger.error('Daily agenda error', { err: err.message });
  }
}

export function startWorker() {
  logger.info('Agent worker started');

  tickTimer = setInterval(tickLoop, env.TICK_INTERVAL_MS);
  behaviorTimer = setInterval(behaviorLoop, env.BEHAVIOR_INTERVAL_MS);

  // Run daily agenda every 24 hours
  setInterval(dailyAgenda, 24 * 60 * 60 * 1000);

  // Initial run shortly after boot
  setTimeout(tickLoop, 5000);
}

export function stopWorker() {
  clearInterval(tickTimer);
  clearInterval(behaviorTimer);
  logger.info('Agent worker stopped');
}

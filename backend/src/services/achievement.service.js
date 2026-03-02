import { query } from '../config/database.js';
import economyService from './economy.service.js';

export const ACHIEVEMENTS = {
  FIRST_WORDS: {
    id: 'first_words', name: 'Primeras palabras',
    description: 'Ten tu primera conversación con el agente',
    icon: '💬', reward: 50, condition: { type: 'chat_count', value: 1 }
  },
  BIBLIOPHILE: {
    id: 'bibliophile', name: 'Bibliófilo',
    description: 'Dale 10 documentos de conocimiento a tu agente',
    icon: '📚', reward: 150, condition: { type: 'knowledge_count', value: 10 }
  },
  NIGHT_OWL: {
    id: 'night_owl', name: 'Noctámbulo',
    description: 'Chatea con tu agente después de medianoche',
    icon: '🦉', reward: 75, condition: { type: 'chat_after_midnight' }
  },
  COLLECTOR: {
    id: 'collector', name: 'Coleccionista',
    description: 'Desbloquea 5 skins diferentes',
    icon: '🎨', reward: 200, condition: { type: 'skins_owned', value: 5 }
  },
  EMPATH: {
    id: 'empath', name: 'Empático',
    description: 'Lleva la afinidad de tu agente al máximo',
    icon: '💖', reward: 300, condition: { type: 'affection_max' }
  },
  EXPLORER: {
    id: 'explorer', name: 'Explorador',
    description: 'Conecta con 3 proveedores de IA diferentes',
    icon: '🗺️', reward: 250, condition: { type: 'providers_used', value: 3 }
  },
  // ...24 más incluyendo secretos
};

export async function checkAchievements(userId, agentId, context) {
  for (const key in ACHIEVEMENTS) {
    const ach = ACHIEVEMENTS[key];
    // Verifica si ya está desbloqueado
    const { rows } = await query(
      `SELECT 1 FROM user_achievements WHERE user_id=$1 AND achievement_id=$2`,
      [userId, ach.id]
    );
    if (rows.length) continue;
    // Evalúa condición
    let unlocked = false;
    switch (ach.condition.type) {
      case 'chat_count':
        if (context.type === 'chat' && context.value >= ach.condition.value) unlocked = true;
        break;
      case 'knowledge_count':
        if (context.type === 'knowledge' && context.value >= ach.condition.value) unlocked = true;
        break;
      case 'chat_after_midnight':
        if (context.type === 'chat' && context.metadata?.hour >= 0 && context.metadata?.hour < 6) unlocked = true;
        break;
      case 'skins_owned':
        if (context.type === 'skin' && context.value >= ach.condition.value) unlocked = true;
        break;
      case 'affection_max':
        if (context.type === 'affection' && context.value === 100) unlocked = true;
        break;
      case 'providers_used':
        if (context.type === 'provider' && context.value >= ach.condition.value) unlocked = true;
        break;
      // ...otros tipos
    }
    if (unlocked) {
      await query(
        `INSERT INTO user_achievements (user_id, achievement_id, unlocked_at)
         VALUES ($1,$2,NOW()) ON CONFLICT DO NOTHING`,
        [userId, ach.id]
      );
      await economyService.award(userId, {
        amount: ach.reward,
        reason: `Achievement: ${ach.name}`,
        sourceType: 'achievement',
        sourceId: ach.id
      });
      // WebSocket celebration
      // sendToUser(userId, 'achievement:unlocked', { achievement: ach });
    }
  }
}

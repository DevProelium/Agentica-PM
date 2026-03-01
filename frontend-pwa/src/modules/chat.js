import api from '../core/api.js';
import { getState } from '../core/store.js';

export const chat = {
  async send(content) {
    const agent = getState('agent');
    if (!agent) throw new Error('No agent selected');
    return api.sendMessage(agent.id, { content });
  },

  async history(limit = 50, offset = 0) {
    const agent = getState('agent');
    if (!agent) return [];
    return api.chatHistory(agent.id, { limit, offset });
  },
};

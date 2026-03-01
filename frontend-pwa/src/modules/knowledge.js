import api from '../core/api.js';
import { getState } from '../core/store.js';

export const knowledge = {
  async list() {
    const agent = getState('agent');
    if (!agent) return [];
    return api.listKnowledge(agent.id);
  },

  async add(title, content, sourceUrl = null) {
    const agent = getState('agent');
    if (!agent) throw new Error('No agent selected');
    return api.addKnowledge(agent.id, { title, content, sourceUrl });
  },

  async remove(itemId) {
    const agent = getState('agent');
    if (!agent) return;
    return api.removeKnowledge(agent.id, itemId);
  },
};

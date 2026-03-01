import api from '../core/api.js';
import { getState, setState } from '../core/store.js';

export const care = {
  async feed(itemId = null) {
    const agent = getState('agent');
    if (!agent) return;
    const updated = await api.feed(agent.id, itemId ? { itemId } : {});
    setState({ agent: updated });
    return updated;
  },

  async play() {
    const agent = getState('agent');
    if (!agent) return;
    const updated = await api.play(agent.id);
    setState({ agent: updated });
    return updated;
  },

  async sleep() {
    const agent = getState('agent');
    if (!agent) return;
    const updated = await api.sleep(agent.id);
    setState({ agent: updated });
    return updated;
  },

  async clean() {
    const agent = getState('agent');
    if (!agent) return;
    const updated = await api.clean(agent.id);
    setState({ agent: updated });
    return updated;
  },
};

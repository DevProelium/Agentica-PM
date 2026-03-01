import agentService  from '../../services/agent.service.js';
import { sendToUser } from '../broadcaster.js';

const CARE_ACTIONS = { feed: 'feed', play: 'play', sleep: 'sleep', clean: 'clean' };

export async function handleCareMessage(ws, msg, user) {
  const { agentId, action, item } = msg.payload || {};
  if (!agentId || !action) {
    ws.send(JSON.stringify({ type: 'error', payload: 'Missing agentId or action' }));
    return;
  }

  if (!CARE_ACTIONS[action]) {
    ws.send(JSON.stringify({ type: 'error', payload: `Unknown care action: ${action}` }));
    return;
  }

  let updated;
  switch (action) {
    case 'feed':  updated = await agentService.feed(agentId, user.id, item);  break;
    case 'play':  updated = await agentService.play(agentId, user.id);         break;
    case 'sleep': updated = await agentService.sleep(agentId, user.id);        break;
    case 'clean': updated = await agentService.clean(agentId, user.id);        break;
  }

  if (!updated) {
    ws.send(JSON.stringify({ type: 'error', payload: 'Agent not found' }));
    return;
  }

  sendToUser(user.id, 'agent:state', updated);
}

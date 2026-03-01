import agentService from '../../services/agent.service.js';
import { sendToUser } from '../broadcaster.js';

export async function handleChatMessage(ws, msg, user) {
  const { agentId, content } = msg.payload || {};
  if (!agentId || !content) {
    ws.send(JSON.stringify({ type: 'error', payload: 'Missing agentId or content' }));
    return;
  }

  const response = await agentService.chat(agentId, user.id, content);

  // Send the reply back to the same user
  sendToUser(user.id, 'chat:reply', {
    agentId,
    content: response.content,
    tokens:  response.tokens,
  });
}

import { broadcast, sendToUser } from '../broadcaster.js';
import { query } from '../../config/database.js';

/** In-memory map of roomId → Set of userIds */
const roomOccupants = new Map();

export async function handleMetaverseMessage(ws, msg, user) {
  const { action, roomId, position, rotation, animation } = msg.payload || {};

  switch (action) {
    case 'join': {
      if (!roomId) return;
      if (!roomOccupants.has(roomId)) roomOccupants.set(roomId, new Set());
      roomOccupants.get(roomId).add(user.id);
      broadcast('metaverse:player_joined', { roomId, userId: user.id });
      sendToUser(user.id, 'metaverse:room_state', {
        roomId,
        occupants: [...(roomOccupants.get(roomId) || [])],
      });
      break;
    }
    case 'leave': {
      if (!roomId) return;
      roomOccupants.get(roomId)?.delete(user.id);
      broadcast('metaverse:player_left', { roomId, userId: user.id });
      break;
    }
    case 'move': {
      broadcast('metaverse:player_moved', { roomId, userId: user.id, position, rotation, animation });
      break;
    }
    case 'chat': {
      const { content, agentId } = msg.payload;
      broadcast('metaverse:chat', { roomId, userId: user.id, agentId, content });
      break;
    }
    default:
      ws.send(JSON.stringify({ type: 'error', payload: `Unknown metaverse action: ${action}` }));
  }
}

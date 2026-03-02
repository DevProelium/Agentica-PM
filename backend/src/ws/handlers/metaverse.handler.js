import { broadcast, sendToUser } from '../broadcaster.js';
import { query } from '../../config/database.js';
import environmentService from '../../services/environment.service.js';

/** In-memory map of roomId → Set of userIds */
const roomOccupants = new Map();
const userPositions = new Map(); // userId -> { x, y, z }

export async function handleMetaverseMessage(ws, msg, user) {
  const { action, roomId, position, rotation, animation } = msg.payload || {};

  switch (action) {
    case 'join': {
      if (!roomId) return;
      if (!roomOccupants.has(roomId)) roomOccupants.set(roomId, new Set());
      roomOccupants.get(roomId).add(user.id);
      
      // Actualizamos percepción inicial
      environmentService.updateScene(roomId || 'lobby', {
        players: Array.from(roomOccupants.get(roomId || 'lobby') || []).map(id => ({ name: `User ${id.slice(0,4)}`, id })),
        objects: [{ name: 'Alicia (The Red Orb)', id: 'alicia_orb' }]
      });

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
      if (position) {
        userPositions.set(user.id, position);
        // Actualizamos el servicio de entorno para que el agente "vea" el movimiento
        environmentService.updateScene(roomId || 'lobby', {
          players: Array.from(roomOccupants.get(roomId || 'lobby') || []).map(id => ({ 
            name: user.id === id ? 'You' : `User ${id.slice(0,4)}`, 
            position: userPositions.get(id) 
          })),
          objects: [{ name: 'Alicia (The Red Orb)', id: 'alicia_orb' }]
        });
      }
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

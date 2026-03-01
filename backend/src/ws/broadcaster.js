import { clients } from './server.js';

/**
 * Send a JSON message to all WebSocket connections of a given user.
 */
export function sendToUser(userId, type, payload) {
  const userClients = clients.get(userId);
  if (!userClients) return;
  const msg = JSON.stringify({ type, payload });
  for (const ws of userClients) {
    if (ws.readyState === 1 /* OPEN */) {
      ws.send(msg);
    }
  }
}

/**
 * Broadcast to every connected client.
 */
export function broadcast(type, payload) {
  const msg = JSON.stringify({ type, payload });
  for (const userClients of clients.values()) {
    for (const ws of userClients) {
      if (ws.readyState === 1) ws.send(msg);
    }
  }
}

/**
 * Broadcast to a set of userIds.
 */
export function broadcastToUsers(userIds, type, payload) {
  for (const uid of userIds) {
    sendToUser(uid, type, payload);
  }
}

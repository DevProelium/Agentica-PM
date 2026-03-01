import { WebSocketServer } from 'ws';
import { logger } from '../utils/logger.js';
import { authenticate as authenticateWs } from './handlers/agent-state.handler.js';
import { handleChatMessage }    from './handlers/chat.handler.js';
import { handleCareMessage }    from './handlers/care.handler.js';
import { handleMetaverseMessage } from './handlers/metaverse.handler.js';
import { broadcast }            from './broadcaster.js';

/** Map of userId → Set of ws clients */
export const clients = new Map();

export function createWsServer(httpServer) {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', async (ws, req) => {
    // Authenticate via ?token= query param
    const url = new URL(req.url, 'http://localhost');
    const token = url.searchParams.get('token');
    const user  = authenticateWs(token);

    if (!user) {
      ws.close(4001, 'Unauthorized');
      return;
    }

    ws.userId  = user.id;
    ws.isAlive = true;

    // Track client
    if (!clients.has(user.id)) clients.set(user.id, new Set());
    clients.get(user.id).add(ws);

    logger.debug(`WS connected: user=${user.id}`);

    ws.on('pong', () => { ws.isAlive = true; });

    ws.on('message', async raw => {
      let msg;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        ws.send(JSON.stringify({ type: 'error', payload: 'Invalid JSON' }));
        return;
      }

      try {
        switch (msg.type) {
          case 'chat':      await handleChatMessage(ws, msg, user);      break;
          case 'care':      await handleCareMessage(ws, msg, user);      break;
          case 'metaverse': await handleMetaverseMessage(ws, msg, user); break;
          default:
            ws.send(JSON.stringify({ type: 'error', payload: `Unknown message type: ${msg.type}` }));
        }
      } catch (err) {
        logger.error('WS handler error', { err: err.message });
        ws.send(JSON.stringify({ type: 'error', payload: err.message }));
      }
    });

    ws.on('close', () => {
      clients.get(user.id)?.delete(ws);
      if (clients.get(user.id)?.size === 0) clients.delete(user.id);
      logger.debug(`WS disconnected: user=${user.id}`);
    });

    ws.send(JSON.stringify({ type: 'connected', payload: { userId: user.id } }));
  });

  // Heartbeat ping every 30s
  const heartbeat = setInterval(() => {
    wss.clients.forEach(ws => {
      if (!ws.isAlive) { ws.terminate(); return; }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => clearInterval(heartbeat));

  logger.info('WebSocket server ready at /ws');
  return wss;
}

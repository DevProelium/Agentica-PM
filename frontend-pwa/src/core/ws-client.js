import { getState } from './store.js';

let ws = null;
const handlers = new Map();

export function connect() {
  const token = getState('accessToken');
  if (!token) return;
  if (ws && ws.readyState < 2) return; // already open or connecting

  const wsUrl = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws?token=${token}`;
  ws = new WebSocket(wsUrl);

  ws.onopen  = () => { console.log('[WS] connected'); emit('_connected', {}); };
  ws.onclose = () => { console.log('[WS] closed'); scheduleReconnect(); };
  ws.onerror = (e) => console.warn('[WS] error', e);

  ws.onmessage = (evt) => {
    try {
      const { type, payload } = JSON.parse(evt.data);
      emit(type, payload);
    } catch {}
  };
}

export function send(type, payload) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return false;
  ws.send(JSON.stringify({ type, payload }));
  return true;
}

export function on(type, fn) {
  if (!handlers.has(type)) handlers.set(type, new Set());
  handlers.get(type).add(fn);
  return () => handlers.get(type).delete(fn);
}

function emit(type, payload) {
  handlers.get(type)?.forEach(fn => fn(payload));
}

let reconnectTimer = null;
function scheduleReconnect() {
  clearTimeout(reconnectTimer);
  reconnectTimer = setTimeout(() => connect(), 3000);
}

export function disconnect() {
  clearTimeout(reconnectTimer);
  ws?.close();
  ws = null;
}

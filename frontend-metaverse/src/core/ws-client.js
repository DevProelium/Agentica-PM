let ws = null;
const handlers = new Map();

export function connect(token) {
  if (ws && ws.readyState < 2) return;
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  ws = new WebSocket(`${proto}://${location.host}/ws?token=${token}`);

  ws.onopen    = () => emit('_open', {});
  ws.onclose   = () => { emit('_close', {}); setTimeout(() => connect(token), 3000); };
  ws.onerror   = (e) => emit('_error', e);
  ws.onmessage = (e) => {
    try { const { type, payload } = JSON.parse(e.data); emit(type, payload); }
    catch {}
  };
}

export function send(type, payload) {
  if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type, payload }));
}

export function on(type, fn) {
  if (!handlers.has(type)) handlers.set(type, new Set());
  handlers.get(type).add(fn);
  return () => handlers.get(type)?.delete(fn);
}

function emit(type, payload) {
  handlers.get(type)?.forEach(fn => fn(payload));
}

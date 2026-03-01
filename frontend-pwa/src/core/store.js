/** Lightweight reactive store using a Map + event listeners. */
const state = {
  user:        null,
  agent:       null,
  agents:      [],
  accessToken: null,
  route:       'home',
};

const listeners = new Map();

export function getState(key) {
  return key ? state[key] : { ...state };
}

export function setState(updates) {
  const changed = [];
  for (const [k, v] of Object.entries(updates)) {
    if (state[k] !== v) {
      state[k] = v;
      changed.push(k);
    }
  }
  for (const k of changed) {
    listeners.get(k)?.forEach(fn => fn(state[k]));
    listeners.get('*')?.forEach(fn => fn(state));
  }
}

export function subscribe(key, fn) {
  if (!listeners.has(key)) listeners.set(key, new Set());
  listeners.get(key).add(fn);
  return () => listeners.get(key).delete(fn);
}

// Persist auth in localStorage
export function loadPersistedAuth() {
  try {
    const token = localStorage.getItem('accessToken');
    if (token) setState({ accessToken: token });
  } catch { /* incognito */ }
}

export function persistAuth(token) {
  try { localStorage.setItem('accessToken', token); } catch { /* */ }
  setState({ accessToken: token });
}

export function clearAuth() {
  try { localStorage.removeItem('accessToken'); } catch { /* */ }
  setState({ accessToken: null, user: null, agent: null });
}

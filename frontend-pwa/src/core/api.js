import { getState } from './store.js';

const BASE = '/api/v1';

async function request(method, path, body, opts = {}) {
  const token = getState('accessToken');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...opts.headers,
  };

  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw Object.assign(new Error(err.error || 'API error'), { status: res.status });
  }

  return res.status === 204 ? null : res.json();
}

export const api = {
  // Auth
  register:    (d)       => request('POST', '/auth/register', d),
  login:       (d)       => request('POST', '/auth/login', d),
  refresh:     (d)       => request('POST', '/auth/refresh', d),
  logout:      (d)       => request('POST', '/auth/logout', d),

  // Agents
  listAgents:  ()        => request('GET',  '/agents'),
  getAgent:    (id)      => request('GET',  `/agents/${id}`),
  createAgent: (d)       => request('POST', '/agents', d),
  updateAgent: (id, d)   => request('PUT',  `/agents/${id}`, d),
  deleteAgent: (id)      => request('DELETE',`/agents/${id}`),

  // Chat
  sendMessage: (id, d)   => request('POST', `/chat/${id}/message`, d),
  chatHistory: (id, p)   => request('GET',  `/chat/${id}/history?limit=${p?.limit||50}&offset=${p?.offset||0}`),
  clearHistory:(id)      => request('DELETE',`/chat/${id}/history`),

  // Care
  feed:        (id, d)   => request('POST', `/care/${id}/feed`, d),
  play:        (id)      => request('POST', `/care/${id}/play`),
  sleep:       (id)      => request('POST', `/care/${id}/sleep`),
  clean:       (id)      => request('POST', `/care/${id}/clean`),
  careStatus:  (id)      => request('GET',  `/care/${id}/status`),

  // Knowledge
  listKnowledge: (id)    => request('GET',  `/knowledge/${id}`),
  addKnowledge:  (id, d) => request('POST', `/knowledge/${id}`, d),
  removeKnowledge:(id,k) => request('DELETE',`/knowledge/${id}/${k}`),

  // Environment
  getEnv:      (id)      => request('GET',  `/environments/${id}`),
  updateEnv:   (id, d)   => request('PUT',  `/environments/${id}`, d),

  // Store
  listStore:   (q)       => request('GET',  '/store' + (q ? '?'+new URLSearchParams(q) : '')),
  purchase:    (d)       => request('POST', '/store/purchase', d),

  // Inventory
  listInventory: ()      => request('GET',  '/inventory'),
  equip:         (d)     => request('POST', '/inventory/equip', d),

  // Economy
  balance:     ()        => request('GET',  '/economy/balance'),
  dailyReward: ()        => request('POST', '/economy/daily-reward'),
  transactions:()        => request('GET',  '/economy/transactions'),

  // Achievements
  listAchievements: ()   => request('GET',  '/achievements'),
  myAchievements:   ()   => request('GET',  '/achievements/mine'),

  // Metaverse
  listRooms:   ()        => request('GET',  '/metaverse/rooms'),
  createRoom:  (d)       => request('POST', '/metaverse/rooms', d),
  getRoom:     (id)      => request('GET',  `/metaverse/rooms/${id}`),
};

export default api;

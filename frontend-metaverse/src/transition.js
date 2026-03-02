import api from './core/api.js';

export async function enterMetaverse(agentId) {
  // 1. POST /api/metaverse/rooms
  const { id: roomId } = await api.createRoom({ agentId });
  const token = localStorage.getItem('accessToken');
  // 2. Abre metaverso en nueva pestaña
  window.open(`/metaverse?room=${roomId}&token=${token}`, '_blank');
}

// En metaverse/src/core/app.js al cargar:
export function parseQuery() {
  const params = new URLSearchParams(window.location.search);
  return { roomId: params.get('room'), token: params.get('token') };
}

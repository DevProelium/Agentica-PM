const BASE_API = '/api/v1';

function getToken() {
  return localStorage.getItem('accessToken');
}

async function request(method, path, body) {
  const token = getToken();
  const res = await fetch(BASE_API + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const api = {
  listRooms:  ()      => request('GET', '/metaverse/rooms'),
  getRoom:    (id)    => request('GET', `/metaverse/rooms/${id}`),
  createRoom: (data)  => request('POST','/metaverse/rooms', data),
  listAgents: ()      => request('GET', '/agents'),
};

export default api;

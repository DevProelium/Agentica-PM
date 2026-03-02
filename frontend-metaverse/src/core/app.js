import { World }   from './world.js';
import api          from './api.js';
import { connect as connectWs, on, send } from './ws-client.js';
import { HUD }      from '../ui/hud.js';

const token = localStorage.getItem('accessToken');
const loading = document.getElementById('loading-screen');
const roomListEl = document.getElementById('room-list');

async function bootstrap() {
  try {
    // Fetch rooms
    const rooms = await api.listRooms().catch(() => []);

    loading.style.display = 'none';
    roomListEl.style.display = 'block';

    const container = document.getElementById('rooms-container');
    rooms.slice(0, 5).forEach(room => {
      const btn = document.createElement('button');
      btn.className = 'room-btn';
      btn.textContent = `${room.name} (${room.room_type})`;
      btn.addEventListener('click', () => joinRoom(room.id));
      container.appendChild(btn);
    });

    document.getElementById('quick-join').addEventListener('click', () => {
      if (rooms[0]) joinRoom(rooms[0].id);
      else joinRoom('solo');
    });

    document.getElementById('create-room').addEventListener('click', async () => {
      const name = prompt('Room name:');
      if (!name) return;
      const room = await api.createRoom({ name, roomType: 'public' });
      joinRoom(room.id);
    });

    document.getElementById('solo-mode').addEventListener('click', () => joinRoom('solo'));
  } catch (err) {
    loading.querySelector('p').textContent = 'Error: ' + err.message;
  }
}

function joinRoom(roomId) {
  roomListEl.style.display = 'none';

  const canvas = document.getElementById('canvas');
  const world  = new World(canvas);
  world.start().catch(err => console.error('World start failed:', err));

  const hud = new HUD(document.getElementById('hud'));
  hud.init();

  // Emisor de posición para que Alicia nos vea
  setInterval(() => {
    if (world.camera && token) {
      const pos = world.camera.position;
      send('metaverse', { 
        action: 'move', 
        position: { x: pos.x.toFixed(2), y: pos.y.toFixed(2), z: pos.z.toFixed(2) } 
      });
    }
  }, 2000);

  if (token) {
    connectWs(token);
    on('_open', () => {
      if (roomId !== 'solo') {
        send('metaverse', { action: 'join', roomId });
      }
    });
    on('metaverse:player_moved', data => world.onPlayerMoved(data));
    on('metaverse:player_joined', data => hud.notify(`Player joined: ${data.userId.slice(0,8)}`));
    on('metaverse:chat', data => hud.showChat(data));
  }
}

bootstrap();

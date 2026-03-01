import { loadPersistedAuth, persistAuth, getState, setState, subscribe } from './store.js';
import { connect as connectWs } from './ws-client.js';
import { init as initRouter, register, navigate } from './router.js';
import api from './api.js';

// ── Toast helper ─────────────────────────────────────────────
const toastContainer = document.getElementById('toast-container');

export function showToast(msg, type = 'info') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  toastContainer.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// ── Status bar ────────────────────────────────────────────────
function updateStatusBar(agent) {
  if (!agent) return;
  document.getElementById('agent-name').textContent = agent.name || '—';

  const stats = [
    { label: '🍔', key: 'hunger',    color: '#f97316' },
    { label: '😊', key: 'happiness', color: '#a855f7' },
    { label: '⚡', key: 'energy',   color: '#facc15' },
    { label: '🚿', key: 'hygiene',  color: '#38bdf8' },
  ];

  const pills = document.getElementById('stat-pills');
  pills.innerHTML = stats.map(s => `
    <div class="stat-pill">
      <span>${s.label}</span>
      <div class="bar"><div class="bar-fill" style="width:${agent[s.key] || 0}%;background:${s.color}"></div></div>
    </div>
  `).join('');
}

subscribe('agent', updateStatusBar);
subscribe('user', user => {
  if (user) document.getElementById('coins-display').textContent = `🪙 ${user.coins || 0}`;
});

// ── Route registration ────────────────────────────────────────
register('home',     () => import('../views/home-view.js').then(m => m.default()));
register('chat',     () => import('../views/chat-view.js').then(m => m.default()));
register('care',     () => import('../views/care-view.js').then(m => m.default()));
register('store',    () => import('../views/store-view.js').then(m => m.default()));
register('settings', () => import('../views/settings-view.js').then(m => m.default()));
register('agents',   () => import('../views/agents-view.js').then(m => m.default()));
register('decorate', () => import('../views/decorate-view.js').then(m => m.default()));
register('feed',     () => import('../views/feed-view.js').then(m => m.default()));
register('games',    () => import('../views/games-view.js').then(m => m.default()));

// ── Bootstrap ─────────────────────────────────────────────────
async function bootstrap() {
  loadPersistedAuth();

  const loading = document.getElementById('loading');
  const appEl   = document.getElementById('app');

  const token = getState('accessToken');
  if (!token) {
    // Show login
    loading.style.display = 'none';
    appEl.style.display = 'flex';
    initRouter(document.getElementById('view-container'));
    navigate('settings'); // settings doubles as login when no user
    return;
  }

  try {
    // Load initial data
    const agents = await api.listAgents();
    if (agents.length > 0) setState({ agent: agents[0], agents });

    const balance = await api.balance();
    setState({ user: { coins: balance.coins, gems: balance.gems } });

    connectWs();
  } catch (err) {
    console.warn('Bootstrap error:', err);
    if (err.status === 401) {
      // Try refresh
      try {
        const rt = localStorage.getItem('refreshToken');
        if (rt) {
          const { accessToken } = await api.refresh({ refreshToken: rt });
          persistAuth(accessToken);
        }
      } catch { /* ignore */ }
    }
  }

  loading.style.display = 'none';
  appEl.style.display = 'flex';
  initRouter(document.getElementById('view-container'));
  navigate('home');

  // Service Worker registration
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js').catch(() => {});
  }
}

bootstrap();

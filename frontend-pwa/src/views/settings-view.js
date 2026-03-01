import api from '../core/api.js';
import { getState, setState, persistAuth } from '../core/store.js';
import { showToast } from '../core/app.js';

export default async function SettingsView() {
  function render(container) {
    const token = getState('accessToken');

    container.style.cssText = 'padding:64px 16px 80px;min-height:100dvh;';

    if (!token) {
      renderAuth(container);
    } else {
      renderSettings(container);
    }
  }

  function renderAuth(container) {
    container.innerHTML = `
      <h2 style="margin-bottom:24px;font-size:1.4rem;text-align:center">🦋 Welcome to Crisalida</h2>
      <div style="max-width:340px;margin:0 auto">
        <div id="auth-tabs" style="display:flex;gap:8px;margin-bottom:16px">
          <button class="tab-btn active" data-tab="login"  style="flex:1;padding:10px;background:#0f3460;border:none;border-radius:8px;color:#eaeaea;cursor:pointer">Login</button>
          <button class="tab-btn"        data-tab="register" style="flex:1;padding:10px;background:rgba(255,255,255,0.06);border:none;border-radius:8px;color:#eaeaea;cursor:pointer">Register</button>
        </div>
        <form id="auth-form" style="display:flex;flex-direction:column;gap:12px">
          <div id="username-field" style="display:none">
            ${inputField('username', 'Username', 'text')}
          </div>
          ${inputField('email', 'Email', 'email')}
          ${inputField('password', 'Password', 'password')}
          <button type="submit" style="padding:14px;background:#e94560;border:none;border-radius:10px;
            color:#fff;cursor:pointer;font-size:15px;font-weight:600;margin-top:4px">Login</button>
          <p id="auth-error" style="color:#e94560;font-size:13px;text-align:center;display:none"></p>
        </form>
      </div>
    `;

    let mode = 'login';

    container.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        mode = btn.dataset.tab;
        container.querySelectorAll('.tab-btn').forEach(b => {
          b.style.background = b === btn ? '#0f3460' : 'rgba(255,255,255,0.06)';
        });
        container.querySelector('#username-field').style.display = mode === 'register' ? 'block' : 'none';
        container.querySelector('button[type=submit]').textContent = mode === 'login' ? 'Login' : 'Register';
      });
    });

    container.querySelector('#auth-form').addEventListener('submit', async e => {
      e.preventDefault();
      const errEl = container.querySelector('#auth-error');
      errEl.style.display = 'none';
      const email    = container.querySelector('[name=email]').value;
      const password = container.querySelector('[name=password]').value;
      const username = container.querySelector('[name=username]')?.value;

      try {
        const res = mode === 'login'
          ? await api.login({ email, password })
          : await api.register({ username, email, password });

        persistAuth(res.accessToken);
        if (res.refreshToken) localStorage.setItem('refreshToken', res.refreshToken);
        setState({ user: res.user });
        showToast('Welcome!', 'success');

        const { navigate } = await import('../core/router.js');
        navigate('home');
        // Refresh page to load agents
        setTimeout(() => location.reload(), 500);
      } catch (err) {
        errEl.textContent = err.message;
        errEl.style.display = 'block';
      }
    });
  }

  function renderSettings(container) {
    container.innerHTML = `
      <h2 style="margin-bottom:24px">Settings</h2>
      <div style="display:flex;flex-direction:column;gap:10px">
        <button id="logout-btn" style="padding:14px;background:rgba(233,69,96,0.15);border:1px solid #e94560;
          border-radius:10px;color:#e94560;cursor:pointer;font-size:14px">Logout</button>
        <button id="daily-btn" style="padding:14px;background:rgba(250,204,21,0.15);border:1px solid #facc15;
          border-radius:10px;color:#facc15;cursor:pointer;font-size:14px">🪙 Claim Daily Reward</button>
        <button id="metaverse-btn" style="padding:14px;background:rgba(168,85,247,0.15);border:1px solid #a855f7;
          border-radius:10px;color:#a855f7;cursor:pointer;font-size:14px">🌐 Open Metaverse</button>
      </div>
    `;

    container.querySelector('#logout-btn').addEventListener('click', async () => {
      const { clearAuth } = await import('../core/store.js');
      clearAuth();
      location.reload();
    });

    container.querySelector('#daily-btn').addEventListener('click', async () => {
      try {
        const res = await api.dailyReward();
        showToast(`Claimed ${res.coins} coins!`, 'success');
      } catch (err) {
        showToast(err.message, 'error');
      }
    });

    container.querySelector('#metaverse-btn').addEventListener('click', () => {
      window.open('/metaverse/', '_blank');
    });
  }

  function inputField(name, placeholder, type) {
    return `<input name="${name}" type="${type}" placeholder="${placeholder}"
      style="padding:12px 16px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);
      border-radius:10px;color:#eaeaea;font-size:14px;outline:none;width:100%" />`;
  }

  return { render };
}

import { getState, subscribe } from '../core/store.js';
import { Environment } from '../modules/environment.js';

export default async function HomeView() {
  let env3d = null;

  function render(container) {
    const agent = getState('agent');

    container.style.cssText = `
      position: relative;
      height: calc(100dvh - 64px - 48px);
      margin-top: 48px;
      overflow: hidden;
    `;

    container.innerHTML = `
      <canvas id="home-canvas" style="width:100%;height:100%;display:block"></canvas>
      <div id="home-overlay" style="
        position:absolute;bottom:80px;left:0;right:0;
        display:flex;justify-content:center;gap:16px;
        padding:0 16px;">
        <button class="care-btn" data-action="feed"  style="flex:1">🍔 Feed</button>
        <button class="care-btn" data-action="play"  style="flex:1">🎮 Play</button>
        <button class="care-btn" data-action="clean" style="flex:1">🚿 Clean</button>
      </div>
      ${!agent ? `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
        flex-direction:column;gap:16px;background:rgba(26,26,46,0.85)">
        <p style="color:#8892a4">No agent yet</p>
        <button id="create-agent-btn" style="padding:12px 24px;background:#e94560;border:none;border-radius:8px;
          color:#fff;cursor:pointer;font-size:14px">Create Your First Agent</button>
      </div>` : ''}
    `;

    // Style care buttons
    container.querySelectorAll('.care-btn').forEach(btn => {
      Object.assign(btn.style, {
        padding: '12px',
        background: 'rgba(15,52,96,0.85)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
        color: '#eaeaea',
        cursor: 'pointer',
        fontSize: '14px',
        backdropFilter: 'blur(8px)',
      });
      btn.addEventListener('click', () => handleCare(btn.dataset.action));
    });

    container.querySelector('#create-agent-btn')?.addEventListener('click', () => {
      import('../core/router.js').then(m => m.navigate('agents'));
    });

    // Initialize 3D environment
    const canvas = container.querySelector('#home-canvas');
    if (agent && canvas) {
      env3d = new Environment(canvas, agent);
      env3d.start();
    }
  }

  async function handleCare(action) {
    const agent = getState('agent');
    if (!agent) return;
    try {
      const { default: api } = await import('../core/api.js');
      const updated = await api[action](agent.id);
      const { setState } = await import('../core/store.js');
      setState({ agent: updated });
      const { showToast } = await import('../core/app.js');
      showToast(`${action.charAt(0).toUpperCase() + action.slice(1)} complete! +XP`, 'success');
    } catch (err) {
      console.error(err);
    }
  }

  function destroy() {
    env3d?.stop();
  }

  return { render, destroy };
}

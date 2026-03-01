import { getState, setState } from '../core/store.js';
import api from '../core/api.js';
import { showToast } from '../core/app.js';

export default async function CareView() {
  function render(container) {
    const agent = getState('agent');

    container.style.cssText = 'padding:64px 16px 80px;min-height:100dvh;';

    if (!agent) {
      container.innerHTML = '<p style="color:#8892a4;text-align:center;padding:40px">No agent selected</p>';
      return;
    }

    container.innerHTML = `
      <h2 style="margin-bottom:16px;font-size:1.2rem">Care for ${agent.name}</h2>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:24px">
        ${statCard('🍔', 'Hunger',    agent.hunger,    '#f97316')}
        ${statCard('😊', 'Happiness', agent.happiness, '#a855f7')}
        ${statCard('⚡', 'Energy',    agent.energy,    '#facc15')}
        ${statCard('🚿', 'Hygiene',   agent.hygiene,   '#38bdf8')}
        ${statCard('💬', 'Social',    agent.social,    '#34d399')}
        ${statCard('⭐', 'XP',        agent.xp % 100,  '#e94560')}
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        ${actionBtn('feed',  '🍔', 'Feed',  '#f97316')}
        ${actionBtn('play',  '🎮', 'Play',  '#a855f7')}
        ${actionBtn('sleep', '💤', 'Sleep', '#38bdf8')}
        ${actionBtn('clean', '🚿', 'Clean', '#34d399')}
      </div>

      <div style="margin-top:16px;padding:12px 16px;background:rgba(255,255,255,0.04);border-radius:12px">
        <p style="font-size:13px;color:#8892a4">Level ${agent.level} · ${agent.is_alive ? '💚 Alive' : '💔 Needs attention'}</p>
      </div>
    `;

    container.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => doAction(btn.dataset.action));
    });
  }

  function statCard(icon, label, value, color) {
    return `
      <div style="background:rgba(255,255,255,0.04);border-radius:12px;padding:14px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-size:12px;color:#8892a4">${icon} ${label}</span>
          <span style="font-size:12px;font-weight:600;color:${color}">${value}%</span>
        </div>
        <div style="height:6px;background:rgba(255,255,255,0.08);border-radius:3px">
          <div style="height:100%;width:${value}%;background:${color};border-radius:3px;transition:width 0.5s"></div>
        </div>
      </div>
    `;
  }

  function actionBtn(action, icon, label, color) {
    return `
      <button data-action="${action}" style="
        padding:20px;border:none;border-radius:12px;
        background:${color}22;border:1px solid ${color}44;
        color:#eaeaea;cursor:pointer;font-size:28px;
        display:flex;flex-direction:column;align-items:center;gap:4px">
        ${icon}
        <span style="font-size:11px;color:#8892a4">${label}</span>
      </button>
    `;
  }

  async function doAction(action) {
    const agent = getState('agent');
    if (!agent) return;
    try {
      const updated = await api[action](agent.id);
      setState({ agent: updated });
      const labels = { feed:'Fed 🍔', play:'Had fun 🎮', sleep:'Rested 💤', clean:'Cleaned 🚿' };
      showToast(labels[action] || 'Done!', 'success');
      // Re-render with new state
      const container = document.getElementById('view-container');
      render(container);
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  return { render };
}

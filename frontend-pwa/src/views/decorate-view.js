import api from '../core/api.js';
import { getState } from '../core/store.js';
import { showToast } from '../core/app.js';

export default async function DecorateView() {
  function render(container) {
    const agent = getState('agent');
    container.style.cssText = 'padding:64px 16px 80px;min-height:100dvh;';

    if (!agent) {
      container.innerHTML = '<p style="color:#8892a4;text-align:center;padding:40px">No agent selected</p>';
      return;
    }

    container.innerHTML = `
      <h2 style="margin-bottom:16px">Decorate Room</h2>
      <p style="color:#8892a4;font-size:13px;margin-bottom:16px">Customize ${agent.name}'s environment</p>
      <div style="display:flex;flex-direction:column;gap:12px" id="decorate-options">
        <div>
          <label style="font-size:12px;color:#8892a4;display:block;margin-bottom:4px">Wallpaper</label>
          <select id="wallpaper-sel" style="${selStyle()}">
            <option value="default">Default</option>
            <option value="stars">Starry Night</option>
            <option value="forest">Forest</option>
            <option value="ocean">Ocean</option>
            <option value="city">City</option>
          </select>
        </div>
        <div>
          <label style="font-size:12px;color:#8892a4;display:block;margin-bottom:4px">Floor</label>
          <select id="floor-sel" style="${selStyle()}">
            <option value="wood">Wood</option>
            <option value="marble">Marble</option>
            <option value="carpet">Carpet</option>
            <option value="concrete">Concrete</option>
          </select>
        </div>
        <button id="save-env" style="padding:12px;background:#e94560;border:none;border-radius:8px;color:#fff;cursor:pointer;font-weight:600">Save Changes</button>
      </div>
    `;

    container.querySelector('#save-env').addEventListener('click', async () => {
      try {
        await api.updateEnv(agent.id, {
          wallpaper: container.querySelector('#wallpaper-sel').value,
          floor:     container.querySelector('#floor-sel').value,
        });
        showToast('Room updated!', 'success');
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  function selStyle() {
    return 'width:100%;padding:10px 14px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:#eaeaea;font-size:13px;';
  }

  return { render };
}

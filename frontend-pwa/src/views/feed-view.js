import api from '../core/api.js';
import { getState } from '../core/store.js';

export default async function FeedView() {
  function render(container) {
    container.style.cssText = 'padding:64px 16px 80px;min-height:100dvh;';
    container.innerHTML = `
      <h2 style="margin-bottom:16px">Activity Feed</h2>
      <div id="feed-list" style="display:flex;flex-direction:column;gap:10px">
        <p style="color:#8892a4;font-size:14px">Loading recent activity…</p>
      </div>
    `;
    loadFeed(container);
  }

  async function loadFeed(container) {
    const agent = getState('agent');
    const list  = container.querySelector('#feed-list');
    try {
      const items = agent ? await api.chatHistory(agent.id, { limit: 20 }) : [];
      if (!items.length) {
        list.innerHTML = '<p style="color:#8892a4;text-align:center;padding:24px">No activity yet. Start chatting!</p>';
        return;
      }
      list.innerHTML = items.reverse().map(m => `
        <div style="padding:12px 14px;background:rgba(255,255,255,0.04);border-radius:10px;border-left:3px solid ${m.role==='user'?'#e94560':'#a855f7'}">
          <p style="font-size:11px;color:#8892a4;margin-bottom:4px">${m.role === 'user' ? '👤 You' : '🤖 ' + (agent?.name||'Agent')} · ${new Date(m.created_at).toLocaleString()}</p>
          <p style="font-size:13px;line-height:1.5">${m.content.slice(0, 200)}${m.content.length>200?'…':''}</p>
        </div>
      `).join('');
    } catch {
      list.innerHTML = '<p style="color:#e94560">Failed to load feed</p>';
    }
  }

  return { render };
}

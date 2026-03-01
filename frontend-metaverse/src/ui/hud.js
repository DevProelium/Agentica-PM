/**
 * Heads-Up Display for the metaverse.
 */
export class HUD {
  constructor(container) {
    this.container = container;
    this.chatLog   = [];
  }

  init() {
    this.container.innerHTML = `
      <div id="hud-top" style="
        display:flex;justify-content:space-between;align-items:center;
        padding:10px 16px;background:rgba(13,13,26,0.6);backdrop-filter:blur(8px)">
        <span style="font-size:13px;color:#a855f7;font-weight:600">🌐 Crisalida Metaverse</span>
        <div style="display:flex;gap:8px">
          <button id="hud-chat-btn" style="padding:6px 12px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:#eaeaea;cursor:pointer;font-size:12px">💬 Chat</button>
          <button id="hud-leave-btn" style="padding:6px 12px;background:rgba(233,69,96,0.15);border:1px solid #e94560;border-radius:8px;color:#e94560;cursor:pointer;font-size:12px">← Leave</button>
        </div>
      </div>
      <div id="hud-chat" style="
        position:fixed;bottom:80px;left:16px;width:280px;
        background:rgba(13,13,26,0.8);border:1px solid rgba(255,255,255,0.08);
        border-radius:10px;overflow:hidden;display:none">
        <div id="chat-log" style="height:140px;overflow-y:auto;padding:8px;display:flex;flex-direction:column;gap:4px"></div>
        <div style="display:flex;border-top:1px solid rgba(255,255,255,0.08)">
          <input id="hud-chat-input" type="text" placeholder="Message…"
            style="flex:1;padding:8px 10px;background:transparent;border:none;color:#eaeaea;font-size:12px;outline:none" />
          <button id="hud-chat-send" style="padding:8px;background:none;border:none;color:#a855f7;cursor:pointer">→</button>
        </div>
      </div>
      <div id="hud-notifications" style="position:fixed;top:60px;right:16px;display:flex;flex-direction:column;gap:6px;z-index:50"></div>
    `;

    document.getElementById('hud-leave-btn').addEventListener('click', () => {
      location.href = '/';
    });

    document.getElementById('hud-chat-btn').addEventListener('click', () => {
      const chat = document.getElementById('hud-chat');
      chat.style.display = chat.style.display === 'none' ? 'block' : 'none';
    });

    const chatInput = document.getElementById('hud-chat-input');
    document.getElementById('hud-chat-send').addEventListener('click', () => this._sendChat(chatInput));
    chatInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); this._sendChat(chatInput); }
    });
  }

  _sendChat(input) {
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    import('../core/ws-client.js').then(({ send }) => {
      send('metaverse', { action: 'chat', content: text });
    });
    this.showChat({ userId: 'me', content: text });
  }

  showChat({ userId, content }) {
    const log = document.getElementById('chat-log');
    if (!log) return;
    const div = document.createElement('div');
    div.style.cssText = 'font-size:11px;color:#eaeaea';
    div.innerHTML = `<span style="color:#a855f7">${userId.slice(0,8)}</span>: ${content}`;
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
  }

  notify(msg) {
    const notifs = document.getElementById('hud-notifications');
    if (!notifs) return;
    const div = document.createElement('div');
    div.style.cssText = `
      padding:8px 12px;background:rgba(168,85,247,0.15);
      border:1px solid #a855f7;border-radius:8px;font-size:12px;
      animation:slide-in 0.3s ease;
    `;
    div.textContent = msg;
    notifs.appendChild(div);
    setTimeout(() => div.remove(), 3000);
  }
}

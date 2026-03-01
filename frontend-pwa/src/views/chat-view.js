import { getState } from '../core/store.js';
import api from '../core/api.js';
import { on } from '../core/ws-client.js';

export default async function ChatView() {
  let unsubWs = null;
  let agentId  = null;

  function render(container) {
    const agent = getState('agent');
    agentId = agent?.id;

    container.style.cssText = 'padding-top:56px;padding-bottom:64px;height:100dvh;display:flex;flex-direction:column;';

    container.innerHTML = `
      <div id="chat-messages" style="flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;"></div>
      <div style="padding:12px 16px;display:flex;gap:8px;background:rgba(22,33,62,0.95);border-top:1px solid rgba(255,255,255,0.08)">
        <input id="chat-input" type="text" placeholder="Talk to ${agent?.name || 'your agent'}…"
          style="flex:1;padding:12px 16px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);
          border-radius:24px;color:#eaeaea;font-size:15px;outline:none;" />
        <button id="chat-send" style="padding:12px 20px;background:#e94560;border:none;border-radius:24px;
          color:#fff;cursor:pointer;font-weight:600">Send</button>
      </div>
    `;

    if (agent) loadHistory();

    const input = container.querySelector('#chat-input');
    const send  = container.querySelector('#chat-send');

    const doSend = async () => {
      const text = input.value.trim();
      if (!text || !agentId) return;
      input.value = '';
      appendMessage('user', text);
      const loading = appendMessage('assistant', '…');
      try {
        const res = await api.sendMessage(agentId, { content: text });
        loading.remove();
        appendMessage('assistant', res.content);
      } catch (err) {
        loading.remove();
        appendMessage('assistant', '⚠️ Error: ' + err.message);
      }
    };

    send.addEventListener('click', doSend);
    input.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doSend(); } });

    // Listen for WS chat replies (in case sent via WS too)
    unsubWs = on('chat:reply', ({ content }) => {
      appendMessage('assistant', content);
    });
  }

  let container;
  const _render = (c) => { container = c; render(c); };

  async function loadHistory() {
    const msgs = container?.querySelector('#chat-messages');
    try {
      const history = await api.chatHistory(agentId, { limit: 30 });
      history.forEach(m => appendMessage(m.role, m.content));
    } catch {}
    msgs?.scrollTo(0, msgs.scrollHeight);
  }

  function appendMessage(role, text) {
    const msgs = container?.querySelector('#chat-messages');
    if (!msgs) return null;
    const div = document.createElement('div');
    div.style.cssText = `
      max-width:80%;padding:10px 14px;border-radius:16px;font-size:14px;line-height:1.5;word-break:break-word;
      align-self:${role === 'user' ? 'flex-end' : 'flex-start'};
      background:${role === 'user' ? '#e94560' : 'rgba(255,255,255,0.07)'};
      color:${role === 'user' ? '#fff' : '#eaeaea'};
    `;
    div.textContent = text;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
    return div;
  }

  function destroy() { unsubWs?.(); }

  return { render: _render, destroy };
}

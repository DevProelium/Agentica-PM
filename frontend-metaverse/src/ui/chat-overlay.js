export class ChatOverlay {
  constructor(agentId, agentSpeech) {
    this.agentId = agentId;
    this.agentSpeech = agentSpeech;
    this._init();
  }

  _init() {
    this.panel = document.createElement('div');
    this.panel.style = 'position:fixed;bottom:0;left:0;right:0;background:rgba(13,13,26,0.96);padding:24px 16px;z-index:100;display:none;';
    this.panel.innerHTML = `
      <input id="chat-input" type="text" style="width:70%;padding:12px;border-radius:8px;border:none;font-size:15px;background:#222;color:#eaeaea" placeholder="Talk to your agent..." />
      <button id="chat-send" style="padding:12px 20px;background:#FFD93D;border:none;border-radius:8px;font-size:15px;color:#222;margin-left:8px">Send</button>
      <button id="chat-close" style="padding:12px 16px;background:#e94560;border:none;border-radius:8px;font-size:15px;color:#fff;margin-left:8px">X</button>
      <div id="chat-messages" style="margin-top:12px;max-height:120px;overflow-y:auto;font-size:13px"></div>
    `;
    document.body.appendChild(this.panel);

    this.panel.querySelector('#chat-send').onclick = () => this._send();
    this.panel.querySelector('#chat-close').onclick = () => this.hide();
  }

  show() { this.panel.style.display = ''; }
  hide() { this.panel.style.display = 'none'; }

  _send() {
    const input = this.panel.querySelector('#chat-input');
    const msg = input.value.trim();
    if (!msg) return;
    input.value = '';
    this._appendMsg('user', msg);
    fetch(`/api/agents/${this.agentId}/chat/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: msg }),
    }).then(r => r.json()).then(res => {
      this._appendMsg('agent', res.content);
      this.agentSpeech.showMessage(res.content);
    });
  }

  _appendMsg(role, text) {
    const div = document.createElement('div');
    div.textContent = (role === 'user' ? 'You: ' : 'Agent: ') + text;
    this.panel.querySelector('#chat-messages').appendChild(div);
  }
}

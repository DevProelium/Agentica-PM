export class EmotePanel {
  constructor(avatar, wsClient) {
    this.avatar = avatar;
    this.wsClient = wsClient;
    this._init();
  }

  _init() {
    const btn = document.createElement('button');
    btn.textContent = '🎭';
    btn.style = 'position:fixed;bottom:32px;right:100px;width:48px;height:48px;background:#4D96FF;color:#fff;border:none;border-radius:50%;font-size:22px;z-index:42;';
    document.body.appendChild(btn);

    btn.addEventListener('click', () => this._showRadial());

    this.menu = document.createElement('div');
    this.menu.style = 'position:fixed;bottom:90px;right:90px;z-index:43;display:none;';
    document.body.appendChild(this.menu);
  }

  _showRadial() {
    this.menu.innerHTML = '';
    this.menu.style.display = 'block';
    const emotes = [
      { name: 'wave', icon: '👋' },
      { name: 'dance', icon: '💃' },
      { name: 'sit', icon: '🪑' },
      { name: 'cheer', icon: '🙌' },
      { name: 'point', icon: '👉' },
      { name: 'bow', icon: '🙇' },
    ];
    emotes.forEach((e, i) => {
      const b = document.createElement('button');
      b.textContent = e.icon;
      b.title = e.name;
      b.style = `position:absolute;left:${40+Math.cos(i*Math.PI/3)*40}px;top:${40+Math.sin(i*Math.PI/3)*40}px;width:40px;height:40px;border-radius:50%;background:#FFD93D;border:none;font-size:22px;`;
      b.addEventListener('click', () => {
        this.avatar.playEmote(e.name);
        this.wsClient.send('meta:avatar_emote', { emote: e.name });
        this.menu.style.display = 'none';
      });
      this.menu.appendChild(b);
    });
    setTimeout(() => { this.menu.style.display = 'none'; }, 4000);
  }
}

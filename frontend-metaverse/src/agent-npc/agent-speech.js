/**
 * Speech bubble displayed above agents in the metaverse.
 */
export class AgentSpeech {
  constructor(container) {
    this.container = container;
    this.bubbles   = [];
  }

  showMessage(text, duration = 6000) {
    if (this.activeDiv) {
      this._fadeOut(this.activeDiv);
      clearTimeout(this._timeout);
      clearInterval(this._typewriterInterval);
    }
    const div = document.createElement('div');
    Object.assign(div.style, {
      position: 'absolute',
      background: 'rgba(13,13,26,0.9)',
      border: '1px solid #a855f7',
      borderRadius: '10px',
      padding: '8px 12px',
      fontSize: '14px',
      color: '#eaeaea',
      maxWidth: '220px',
      pointerEvents: 'none',
      zIndex: '20',
      opacity: '0',
      transform: 'scale(0.8)',
      transition: 'opacity 0.3s, transform 0.3s',
    });
    this.container.appendChild(div);
    this.activeDiv = div;

    // Typewriter effect
    let i = 0;
    div.textContent = '';
    this._typewriterInterval = setInterval(() => {
      div.textContent = text.slice(0, ++i);
      if (i >= text.length) clearInterval(this._typewriterInterval);
    }, 40);

    setTimeout(() => {
      div.style.opacity = '1';
      div.style.transform = 'scale(1)';
    }, 10);

    this._timeout = setTimeout(() => this._fadeOut(div), duration);
  }

  _fadeOut(div) {
    div.style.opacity = '0';
    div.style.transform = 'scale(0.8)';
    setTimeout(() => div.remove(), 300);
    this.activeDiv = null;
  }

  update(agentPosition, camera) {
    if (!this.activeDiv || !agentPosition || !camera) return;
    // Proyecta posición 3D a 2D
    const vector = agentPosition.clone().project(camera);
    const w = window.innerWidth, h = window.innerHeight;
    this.activeDiv.style.left = (vector.x * w / 2 + w / 2) + 'px';
    this.activeDiv.style.top  = (-vector.y * h / 2 + h / 2 - 60) + 'px';

    // Distancia-aware
    const playerPos = window.playerAvatar?.mesh.position;
    if (playerPos) {
      const dist = agentPosition.distanceTo(playerPos);
      if (dist < 8) {
        this.activeDiv.style.display = '';
        this.activeDiv.textContent = this.activeDiv.textContent; // texto completo
      } else if (dist < 20) {
        this.activeDiv.style.display = '';
        this.activeDiv.textContent = '💬';
      } else {
        this.activeDiv.style.display = 'none';
      }
    }
  }
}

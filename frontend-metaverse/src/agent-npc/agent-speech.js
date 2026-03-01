/**
 * Speech bubble displayed above agents in the metaverse.
 */
export class AgentSpeech {
  constructor(container) {
    this.container = container;
    this.bubbles   = [];
  }

  show(agentName, text, position3D, camera, renderer) {
    const bubble = document.createElement('div');
    Object.assign(bubble.style, {
      position: 'fixed',
      background: 'rgba(13,13,26,0.9)',
      border: '1px solid #a855f7',
      borderRadius: '10px',
      padding: '8px 12px',
      fontSize: '12px',
      color: '#eaeaea',
      maxWidth: '200px',
      pointerEvents: 'none',
      transform: 'translate(-50%,-100%)',
      zIndex: '20',
    });
    bubble.innerHTML = `<strong style="color:#a855f7">${agentName}</strong><br>${text}`;
    this.container.appendChild(bubble);

    // Position using projected 3D coords
    if (position3D && camera && renderer) {
      this._updatePosition(bubble, position3D, camera, renderer);
    }

    setTimeout(() => bubble.remove(), 4000);
    return bubble;
  }

  _updatePosition(el, pos3D, camera, renderer) {
    // THREE.Vector3.project
    const v = pos3D.clone().project(camera);
    const hw = renderer.domElement.clientWidth  / 2;
    const hh = renderer.domElement.clientHeight / 2;
    el.style.left = (v.x * hw + hw) + 'px';
    el.style.top  = (-v.y * hh + hh) + 'px';
  }
}

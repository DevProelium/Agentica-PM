export class Joystick {
  constructor(controller) {
    this.controller = controller;
    this.active = false;
    this.center = { x: 0, y: 0 };
    this.knob = null;
    this._init();
  }

  _init() {
    if (!('ontouchstart' in window)) return;
    const joy = document.createElement('div');
    joy.id = 'joystick';
    joy.style = 'position:fixed;bottom:32px;left:32px;width:80px;height:80px;background:rgba(255,255,255,0.08);border-radius:50%;z-index:40;touch-action:none;';
    document.body.appendChild(joy);

    joy.addEventListener('touchstart', e => {
      this.active = true;
      const t = e.touches[0];
      this.center = { x: t.clientX, y: t.clientY };
      this.knob = document.createElement('div');
      this.knob.style = 'position:absolute;width:40px;height:40px;left:20px;top:20px;background:rgba(255,255,255,0.18);border-radius:50%;';
      joy.appendChild(this.knob);
    });

    joy.addEventListener('touchmove', e => {
      if (!this.active) return;
      const t = e.touches[0];
      const dx = t.clientX - this.center.x;
      const dy = t.clientY - this.center.y;
      const mag = Math.min(Math.sqrt(dx*dx+dy*dy), 32);
      const angle = Math.atan2(dy, dx);
      this.knob.style.left = `${40 + Math.cos(angle)*mag}px`;
      this.knob.style.top  = `${40 + Math.sin(angle)*mag}px`;
      this.controller.setInput({ x: Math.cos(angle)*mag/32, z: Math.sin(angle)*mag/32 });
    });

    joy.addEventListener('touchend', () => {
      this.active = false;
      this.controller.setInput({ x: 0, z: 0 });
      this.knob?.remove();
    });

    // Right area for camera swipe
    const swipe = document.createElement('div');
    swipe.style = 'position:fixed;bottom:0;right:0;width:60vw;height:100vh;z-index:39;';
    document.body.appendChild(swipe);
    let lastX = null;
    swipe.addEventListener('touchstart', e => { lastX = e.touches[0].clientX; });
    swipe.addEventListener('touchmove', e => {
      if (lastX !== null) {
        const dx = e.touches[0].clientX - lastX;
        lastX = e.touches[0].clientX;
        this.controller.rotateCamera(dx * 0.005);
      }
    });
    swipe.addEventListener('touchend', () => { lastX = null; });

    // E button
    const eBtn = document.createElement('button');
    eBtn.textContent = 'E';
    eBtn.style = 'position:fixed;bottom:32px;right:32px;width:48px;height:48px;background:#FFD93D;color:#222;border:none;border-radius:50%;font-size:20px;z-index:41;';
    document.body.appendChild(eBtn);
    eBtn.addEventListener('touchstart', () => this.controller.interact());
  }
}

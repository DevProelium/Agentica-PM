/**
 * Player controller: handles keyboard/gamepad input and sends position updates via WS.
 */
export class PlayerController {
  constructor(camera, wsClient) {
    this.camera   = camera;
    this.wsClient = wsClient;
    this.keys     = {};
    this.speed    = 5;
    this._broadcast = this._throttle(this._broadcastPosition.bind(this), 100);
    this._init();
  }

  _init() {
    this._kd = e => { this.keys[e.code] = true; };
    this._ku = e => { this.keys[e.code] = false; this._broadcast(); };
    document.addEventListener('keydown', this._kd);
    document.addEventListener('keyup',   this._ku);
  }

  update(dt) {
    const dir = { x: 0, z: 0 };
    if (this.keys['KeyW']) dir.z -= 1;
    if (this.keys['KeyS']) dir.z += 1;
    if (this.keys['KeyA']) dir.x -= 1;
    if (this.keys['KeyD']) dir.x += 1;

    if (dir.x !== 0 || dir.z !== 0) {
      const angle  = Math.atan2(dir.x, dir.z) + this.camera.rotation.y;
      const speed  = this.speed * dt;
      this.camera.position.x += Math.sin(angle) * speed;
      this.camera.position.z += Math.cos(angle) * speed;
      this._broadcast();
    }
  }

  _broadcastPosition() {
    this.wsClient?.send('metaverse', {
      action:   'move',
      position: { x: this.camera.position.x, y: this.camera.position.y, z: this.camera.position.z },
      rotation: this.camera.rotation.y,
    });
  }

  _throttle(fn, ms) {
    let last = 0;
    return () => {
      const now = Date.now();
      if (now - last > ms) { last = now; fn(); }
    };
  }

  destroy() {
    document.removeEventListener('keydown', this._kd);
    document.removeEventListener('keyup',   this._ku);
  }
}

/**
 * Third-person / first-person camera manager.
 */
export class CameraManager {
  constructor(camera, target) {
    this.camera   = camera;
    this.target   = target; // Three.js Object3D
    this.mode     = 'first'; // 'first' | 'third'
    this.distance = 5;
    this.euler    = { x: 0, y: 0 };
    this._initMouseLook();
  }

  _initMouseLook() {
    document.addEventListener('mousemove', e => {
      if (!document.pointerLockElement) return;
      this.euler.y -= e.movementX * 0.002;
      this.euler.x -= e.movementY * 0.002;
      this.euler.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, this.euler.x));
    });

    document.addEventListener('keydown', e => {
      if (e.code === 'KeyV') this.toggleMode();
    });
  }

  toggleMode() {
    this.mode = this.mode === 'first' ? 'third' : 'first';
  }

  update() {
    if (!this.camera || !this.target) return;

    if (this.mode === 'first') {
      this.camera.position.copy(this.target.position);
      this.camera.position.y += 1.7;
      this.camera.rotation.set(this.euler.x, this.euler.y, 0, 'YXZ');
    } else {
      const offset = {
        x: -Math.sin(this.euler.y) * this.distance,
        y: 2,
        z: -Math.cos(this.euler.y) * this.distance,
      };
      this.camera.position.set(
        this.target.position.x + offset.x,
        this.target.position.y + offset.y,
        this.target.position.z + offset.z
      );
      this.camera.lookAt(this.target.position);
    }
  }
}

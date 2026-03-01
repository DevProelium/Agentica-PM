const THREE_CDN = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

/**
 * The main 3D world: scene, renderer, basic environment.
 */
export class World {
  constructor(canvas) {
    this.canvas  = canvas;
    this.running = false;
    this.players = new Map();
  }

  async start() {
    try {
      const THREE = await import(THREE_CDN);
      this._initThree(THREE);
    } catch (err) {
      console.error('Three.js load failed', err);
    }
  }

  _initThree(THREE) {
    const {
      Scene, PerspectiveCamera, WebGLRenderer,
      AmbientLight, DirectionalLight, HemisphereLight,
      BoxGeometry, MeshStandardMaterial, Mesh,
      PlaneGeometry, GridHelper, Color, Fog,
      Vector3, Clock,
    } = THREE;

    // Scene
    this.scene = new Scene();
    this.scene.background = new Color(0x0d0d1a);
    this.scene.fog = new Fog(0x0d0d1a, 20, 80);

    // Camera
    this.camera = new PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 200);
    this.camera.position.set(0, 1.7, 0);

    // Renderer
    this.renderer = new WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.renderer.setSize(innerWidth, innerHeight);
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;

    // Lights
    this.scene.add(new AmbientLight(0xffffff, 0.3));
    this.scene.add(new HemisphereLight(0x0d0d1a, 0x1a1a2e, 0.5));
    const sun = new DirectionalLight(0xa855f7, 1.5);
    sun.position.set(10, 20, 10);
    sun.castShadow = true;
    this.scene.add(sun);

    // Ground
    const ground = new Mesh(
      new PlaneGeometry(100, 100),
      new MeshStandardMaterial({ color: 0x111128 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
    this.scene.add(new GridHelper(100, 100, 0x222244, 0x222244));

    // Some decorative cubes
    for (let i = 0; i < 20; i++) {
      const size = 0.5 + Math.random() * 2;
      const cube = new Mesh(
        new BoxGeometry(size, size * 2, size),
        new MeshStandardMaterial({ color: new Color().setHSL(Math.random(), 0.6, 0.3) })
      );
      cube.position.set((Math.random() - 0.5) * 40, size, (Math.random() - 0.5) * 40);
      cube.castShadow = true;
      this.scene.add(cube);
    }

    // Player controller
    this._setupControls(THREE);

    // Clock & loop
    this.clock = new Clock();
    this.running = true;
    this._animate();

    // Resize
    window.addEventListener('resize', () => {
      this.camera.aspect = innerWidth / innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(innerWidth, innerHeight);
    });
  }

  _setupControls(THREE) {
    const { Euler, Vector3 } = THREE;
    this.keys = {};
    this.euler = new Euler(0, 0, 0, 'YXZ');
    this.velocity = new THREE.Vector3();

    document.addEventListener('keydown', e => { this.keys[e.code] = true; });
    document.addEventListener('keyup',   e => { this.keys[e.code] = false; });

    // Pointer lock for mouse look
    this.canvas.addEventListener('click', () => {
      this.canvas.requestPointerLock();
    });

    document.addEventListener('pointerlockchange', () => {
      this._pointerLocked = document.pointerLockElement === this.canvas;
    });

    document.addEventListener('mousemove', e => {
      if (!this._pointerLocked) return;
      this.euler.y -= e.movementX * 0.002;
      this.euler.x -= e.movementY * 0.002;
      this.euler.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, this.euler.x));
      this.camera.quaternion.setFromEuler(this.euler);
    });
  }

  _animate() {
    if (!this.running) return;
    requestAnimationFrame(() => this._animate());

    const dt = this.clock.getDelta();
    this._updateMovement(dt);
    this.renderer.render(this.scene, this.camera);
  }

  _updateMovement(dt) {
    if (!this.keys) return;
    const speed = 5 * dt;
    const dir   = { x: 0, z: 0 };

    if (this.keys['KeyW'] || this.keys['ArrowUp'])    dir.z -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown'])  dir.z += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft'])  dir.x -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) dir.x += 1;

    if (dir.x !== 0 || dir.z !== 0) {
      const angle = Math.atan2(dir.x, dir.z) + this.euler.y;
      this.camera.position.x += Math.sin(angle) * speed;
      this.camera.position.z += Math.cos(angle) * speed;
    }
  }

  onPlayerMoved({ userId, position, rotation }) {
    // Update remote player avatar position (simplified)
    console.log('[World] player moved', userId, position);
  }

  stop() {
    this.running = false;
    this.renderer?.dispose();
  }
}

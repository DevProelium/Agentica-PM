/**
 * Environment module: renders the agent's 3D room using Three.js.
 * Falls back gracefully if Three.js is not available.
 */

const THREE_CDN = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export class Environment {
  constructor(canvas, agent) {
    this.canvas  = canvas;
    this.agent   = agent;
    this.running = false;
    this.rafId   = null;
  }

  async start() {
    try {
      const THREE = await import(THREE_CDN);
      this._initThree(THREE);
    } catch (err) {
      console.warn('Three.js not available, using 2D fallback', err);
      this._init2D();
    }
  }

  _initThree(THREE) {
    const { Scene, PerspectiveCamera, WebGLRenderer, AmbientLight,
            DirectionalLight, BoxGeometry, MeshStandardMaterial, Mesh,
            PlaneGeometry, Color } = THREE;

    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;

    // Scene
    const scene  = new Scene();
    scene.background = new Color(0x1a1a2e);

    // Camera
    const camera = new PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.set(0, 3, 7);
    camera.lookAt(0, 0, 0);

    // Renderer
    const renderer = new WebGLRenderer({ canvas: this.canvas, antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;

    // Lighting
    scene.add(new AmbientLight(0xffffff, 0.4));
    const dir = new DirectionalLight(0xffffff, 1);
    dir.position.set(5, 8, 5);
    dir.castShadow = true;
    scene.add(dir);

    // Floor
    const floor = new Mesh(
      new PlaneGeometry(10, 10),
      new MeshStandardMaterial({ color: 0x16213e })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Agent placeholder cube
    const agentMesh = new Mesh(
      new BoxGeometry(1, 1.5, 1),
      new MeshStandardMaterial({ color: 0xe94560 })
    );
    agentMesh.position.y = 0.75;
    agentMesh.castShadow = true;
    scene.add(agentMesh);

    this.running = true;
    const animate = () => {
      if (!this.running) return;
      this.rafId = requestAnimationFrame(animate);
      agentMesh.rotation.y += 0.005;
      renderer.render(scene, camera);
    };
    animate();

    this._renderer = renderer;
  }

  _init2D() {
    // Simple canvas 2D fallback
    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      if (!this.running) return;
      const w = this.canvas.width = this.canvas.offsetWidth;
      const h = this.canvas.height = this.canvas.offsetHeight;

      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, w, h);

      // Draw simple agent
      ctx.fillStyle = '#e94560';
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, 40, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fff';
      ctx.font = '32px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🤖', w / 2, h / 2);

      this.rafId = requestAnimationFrame(draw);
    };
    this.running = true;
    draw();
  }

  stop() {
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this._renderer?.dispose();
  }
}

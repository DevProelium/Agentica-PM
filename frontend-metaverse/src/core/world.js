import { PhysicsWorld } from '../physics/physics-world.js';
const THREE_CDN = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export class World {
  constructor(canvas) {
    this.canvas = canvas;
    this.physicsWorld = new PhysicsWorld();
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.lights = [];
    this.roomMeshes = [];
    this.navMesh = null;
    this.running = false;
    this.players = new Map();
  }

  async start() {
    await this.physicsWorld.init();
    await this._initThree();
    this.running = true;
    this._animate();
  }

  async _initThree() {
    const THREE = await import(THREE_CDN);
    const { Scene, PerspectiveCamera, WebGLRenderer, AmbientLight, DirectionalLight, PCFSoftShadowMap, Clock } = THREE;

    this.scene = new Scene();
    this.camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200);
    this.camera.position.set(0, 1.7, 0);

    this.renderer = new WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFSoftShadowMap;

    this.clock = new Clock();

    this.lights.push(new AmbientLight(0xffffff, 0.5));
    const sun = new DirectionalLight(0xffffff, 1.2);
    sun.position.set(10, 20, 10);
    sun.castShadow = true;
    this.lights.push(sun);
    this.lights.forEach(light => this.scene.add(light));

    // --- ESCENA DE PRUEBAS BASICA ---
    // Suelo de rejilla
    const gridHelper = new THREE.GridHelper(50, 50, 0x444444, 0x222222);
    this.scene.add(gridHelper);

    // Suelo sólido más claro para visibilidad
    const floorGeo = new THREE.PlaneGeometry(100, 100);
    const floorMat = new THREE.MeshStandardMaterial({ 
      color: 0xcccccc, 
      roughness: 0.8,
      metalness: 0.2 
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Representación de Alicia (Esfera Roja con Brillo)
    const aliciaGeo = new THREE.SphereGeometry(0.5, 32, 32);
    const aliciaMat = new THREE.MeshStandardMaterial({ 
      color: 0xff0000, 
      emissive: 0x550000,
      roughness: 0.3 
    });
    this.aliciaMesh = new THREE.Mesh(aliciaGeo, aliciaMat);
    this.aliciaMesh.position.set(0, 1.2, -5); // A la altura de los ojos
    this.aliciaMesh.castShadow = true;
    this.scene.add(this.aliciaMesh);

    // TU AVATAR (Cubo Azul que representa tu cuerpo físico)
    const playerGeo = new THREE.BoxGeometry(0.6, 1.8, 0.4);
    const playerMat = new THREE.MeshStandardMaterial({ color: 0x0000ff });
    this.playerMesh = new THREE.Mesh(playerGeo, playerMat);
    this.playerMesh.position.set(0, 0.9, 0);
    this.playerMesh.castShadow = true;
    this.scene.add(this.playerMesh);
    // --------------------------------

    this._setupControls(THREE);

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  async loadRoom(roomConfig) {
    if (!roomConfig || !this.scene) return;
    
    if (roomConfig.walls) {
      for (const wall of roomConfig.walls) {
        const mesh = this._createBox(wall);
        this.scene.add(mesh);
        this.roomMeshes.push(mesh);
      }
    }

    if (roomConfig.floor) {
      const floorMesh = this._createBox(roomConfig.floor);
      this.scene.add(floorMesh);
      this.roomMeshes.push(floorMesh);
    }
  }

  _createBox(data) {
    // Evitamos el error "new window.THREE?.Group()" que es inválido en JS
    const ThreeGroup = window.THREE ? window.THREE.Group : null;
    if (ThreeGroup) {
      return new ThreeGroup();
    }
    // Stub temporal si THREE aún no está en window
    return { add: () => {}, position: { set: () => {} }, rotation: { set: () => {} } };
  }

  _setupControls(THREE) {
    const { Euler, Vector3 } = THREE;
    this.keys = {};
    this.euler = new Euler(0, 0, 0, 'YXZ');
    this.velocity = new Vector3();

    document.addEventListener('keydown', e => { this.keys[e.code] = true; });
    document.addEventListener('keyup',   e => { this.keys[e.code] = false; });

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
    if (!this.running || !this.renderer) return;
    requestAnimationFrame(() => this._animate());

    const dt = this.clock.getDelta();
    this._updateMovement(dt);
    this.physicsWorld.step(dt);
    
    // --- SINCRONIZACION DE TU CUERPO ---
    if (this.playerMesh && this.camera) {
      // Posición del cuerpo sigue a la cámara (pero en el suelo)
      this.playerMesh.position.x = this.camera.position.x;
      this.playerMesh.position.z = this.camera.position.z;
      this.playerMesh.position.y = 0.9; // Altura fija sobre el suelo
      // Rotación opcional para ver hacia donde miras
      this.playerMesh.rotation.y = this.euler.y;
    }

    // --- ALICIA TE OBSERVA ---
    if (this.aliciaMesh && this.playerMesh) {
      // La esfera roja ahora "mira" hacia tu posición
      this.aliciaMesh.lookAt(this.playerMesh.position);
      // Pequeño efecto de flotación para que Alicia se vea viva
      this.aliciaMesh.position.y = 1.2 + Math.sin(Date.now() * 0.002) * 0.05;
    }

    if (this.avatar) this.avatar.update(dt, this.camera);
    if (this.agentNPC) this.agentNPC.update(dt);
    this.renderer.render(this.scene, this.camera);
  }

  _updateMovement(dt) {
    if (!this.keys) return;
    const speed = 5 * dt;
    const dir = { x: 0, z: 0 };

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
    console.log('[World] player moved', userId, position);
  }

  stop() {
    this.running = false;
    this.renderer?.dispose();
  }
}


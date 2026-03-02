
import { CapsuleGeometry, SphereGeometry, MeshToonMaterial, Mesh, Sprite, SpriteMaterial, Texture, Color, AnimationMixer, Group } from 'three';

export class Avatar {
  constructor(scene, THREE, userData) {
    this.scene   = scene;
    this.THREE   = THREE;
    this.userId  = userData.id;
    this.username = userData.username;
    this.color   = new Color().setHSL((parseInt(this.userId, 36) % 360) / 360, 0.7, 0.5);
    this.mesh    = null;
    this.mixer   = null;
    this.animations = {};
    this.rigidBody = null;
    this.controller = null;
    this.nametag = null;
    this._isGLB = false;
    this._currentAnim = 'idle';
    this._bobPhase = Math.random() * Math.PI * 2;
    this._init();
  }

  async _init() {
    try {
      // Intenta cargar GLB
      const glb = await this._loadGLB(`/api/assets/avatar/${this.userId}`);
      this._isGLB = true;
      this.mesh = glb.scene;
      this.scene.add(this.mesh);
      this.mixer = new AnimationMixer(this.mesh);
      glb.animations.forEach(clip => this.animations[clip.name] = this.mixer.clipAction(clip));
    } catch {
      // Placeholder: cápsula + esfera
      const group = new Group();
      const capsule = new Mesh(
        new CapsuleGeometry(0.3, 1.1, 8, 16),
        new MeshToonMaterial({ color: this.color })
      );
      capsule.position.y = 0.55;
      group.add(capsule);
      const head = new Mesh(
        new SphereGeometry(0.28, 16, 16),
        new MeshToonMaterial({ color: 0xfde68a })
      );
      head.position.y = 1.15;
      group.add(head);
      this.mesh = group;
      this.scene.add(group);
    }
    this._setupPhysics();
    this._createNametag();
  }

  async _loadGLB(url) {
    // Loader Three.js GLTFLoader
    const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
    const loader = new GLTFLoader();
    return new Promise((resolve, reject) => {
      loader.load(url, resolve, undefined, reject);
    });
  }

  _setupPhysics() {
    // Integración Rapier: CharacterController + collider cápsula
    // Asume que physicsWorld está accesible globalmente o vía scene
    if (window.physicsWorld) {
      this.rigidBody = window.physicsWorld.addDynamicCapsule(
        this.userId, this.mesh.position.x, this.mesh.position.y, this.mesh.position.z,
        0.3, 0.75
      );
      this.controller = window.physicsWorld.createCharacterController({
        rigidBody: this.rigidBody,
        slopeLimit: Math.PI / 4,
        stepHeight: 0.3,
        gravity: -9.81,
      });
    }
  }

  move(direction, delta) {
    if (!this.controller) return;
    this.controller.move(direction, delta);
    // La posición del mesh se sincroniza desde el rigidBody
    const pos = window.physicsWorld.getPosition(this.userId);
    if (pos) this.mesh.position.set(pos.x, pos.y, pos.z);
  }

  playAnimation(name) {
    if (this._isGLB && this.animations[name]) {
      Object.values(this.animations).forEach(a => a.stop());
      this.animations[name].play();
      this._currentAnim = name;
    }
  }

  playEmote(emoteName) {
    if (this._isGLB && this.animations[emoteName]) {
      this.animations[emoteName].reset().play();
    }
    // Si es placeholder, ignorar silenciosamente
  }

  _createNametag() {
    // Sprite con username, siempre de cara a la cámara
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.font = 'bold 32px Segoe UI';
    ctx.fillStyle = '#a855f7';
    ctx.textAlign = 'center';
    ctx.fillText(this.username, 128, 40);
    const texture = new Texture(canvas);
    texture.needsUpdate = true;
    const material = new SpriteMaterial({ map: texture, transparent: true });
    this.nametag = new Sprite(material);
    this.nametag.scale.set(1.2, 0.3, 1);
    this.mesh.add(this.nametag);
    this.nametag.position.set(0, 1.45, 0);
  }

  update(delta, camera) {
    // Avanza AnimationMixer
    if (this.mixer) this.mixer.update(delta);

    // Animaciones procedurales si es placeholder
    if (!this._isGLB) {
      if (this._currentAnim === 'idle') {
        this.mesh.position.y += Math.sin(performance.now() * 0.002 + this._bobPhase) * 0.01;
      } else if (this._currentAnim === 'walk') {
        this.mesh.rotation.x = Math.sin(performance.now() * 0.005) * 0.08;
      } else if (this._currentAnim === 'run') {
        this.mesh.rotation.x = Math.sin(performance.now() * 0.01) * 0.18;
        this.mesh.position.y += Math.sin(performance.now() * 0.004 + this._bobPhase) * 0.02;
      }
    }

    // Nametag siempre de cara a la cámara
    if (this.nametag && camera) {
      this.nametag.quaternion.copy(camera.quaternion);
    }

    // Sincroniza mesh desde rigidBody
    if (this.rigidBody) {
      const pos = window.physicsWorld.getPosition(this.userId);
      if (pos) this.mesh.position.set(pos.x, pos.y, pos.z);
    }
  }
}

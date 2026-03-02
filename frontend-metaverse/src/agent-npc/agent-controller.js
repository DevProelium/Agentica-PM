
import { Group, CapsuleGeometry, MeshToonMaterial, Mesh, Quaternion, AnimationMixer } from 'three';
import { Pathfinding } from 'three-pathfinding';

export class AgentNPC {
  constructor(scene, THREE, agentData, navMesh, camera) {
    this.scene     = scene;
    this.THREE     = THREE;
    this.agentData = agentData;
    this.skinId    = agentData.skinId;
    this.mesh      = null;
    this.mixer     = null;
    this.animations = {};
    this._isGLB    = false;
    this.pathfinder = new Pathfinding();
    this.navMesh   = navMesh;
    this.zone      = 'room';
    this.groupID   = 0;
    this.path      = [];
    this.currentWaypoint = 0;
    this.speed     = 2;
    this._currentAnim = 'idle';
    this.speech    = null;
    this.camera    = camera;
    this._idleTimer = 0;
    this._sleeping = false;
    this._init();
    this._setupWS();
  }

  async _init() {
    try {
      // Carga GLB desde MinIO
      const glb = await this._loadGLB(`/api/assets/agent-skins/${this.skinId}`);
      this._isGLB = true;
      this.mesh = glb.scene;
      this.scene.add(this.mesh);
      this.mixer = new AnimationMixer(this.mesh);
      glb.animations.forEach(clip => this.animations[clip.name] = this.mixer.clipAction(clip));
    } catch {
      // Placeholder: robot, llama, etc.
      const group = new Group();
      const capsule = new Mesh(
        new CapsuleGeometry(0.3, 1.1, 8, 16),
        new MeshToonMaterial({ color: 0xa855f7 })
      );
      capsule.position.y = 0.55;
      group.add(capsule);
      this.mesh = group;
      this.scene.add(group);
    }
    this.speech = window.agentSpeech || null;
    if (this.navMesh) {
      this.pathfinder.setZoneData(this.zone, Pathfinding.createZone(this.navMesh));
    }
  }

  async _loadGLB(url) {
    const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
    const loader = new GLTFLoader();
    return new Promise((resolve, reject) => {
      loader.load(url, resolve, undefined, reject);
    });
  }

  walkTo(targetPosition) {
    if (!this.mesh || !this.navMesh) return;
    const from = this.mesh.position;
    const path = this.pathfinder.findPath(
      from, targetPosition, this.zone, this.groupID
    );
    if (path && path.length) {
      this.path = path;
      this.currentWaypoint = 0;
      this._currentAnim = 'walk';
      this.playAnimation('walk');
    }
  }

  _followPath(delta) {
    if (!this.path || this.currentWaypoint >= this.path.length) {
      this._currentAnim = 'idle';
      this.playAnimation('idle');
      return;
    }
    const target = this.path[this.currentWaypoint];
    const pos = this.mesh.position;
    const dir = new this.THREE.Vector3(target.x - pos.x, 0, target.z - pos.z);
    const dist = dir.length();
    if (dist < 0.1) {
      this.currentWaypoint++;
      return;
    }
    dir.normalize();
    pos.x += dir.x * this.speed * delta;
    pos.z += dir.z * this.speed * delta;
    // Rotación suave hacia el waypoint
    const targetQuat = new Quaternion().setFromUnitVectors(
      new this.THREE.Vector3(0, 0, 1),
      dir.clone().normalize()
    );
    this.mesh.quaternion.slerp(targetQuat, 0.1);
  }

  playAnimation(name) {
    if (this._isGLB && this.animations[name]) {
      Object.values(this.animations).forEach(a => a.stop());
      this.animations[name].play();
      this._currentAnim = name;
    }
  }

  _setupWS() {
    // Escucha eventos WebSocket 'agent:behavior'
    if (window.wsClient) {
      window.wsClient.on('agent:behavior', data => {
        if (data.agentId !== this.agentData.id) return;
        switch (data.type) {
          case 'walk_to':
            this.walkTo(data.targetPosition);
            break;
          case 'interact_with':
            this.walkTo(data.itemPosition);
            setTimeout(() => this.playAnimation('interact'), 3000);
            break;
          case 'greet_user':
            if (window.playerAvatar) {
              this.walkTo(window.playerAvatar.mesh.position);
              this.playAnimation('wave');
              this.speech?.showMessage(`¡Hola ${window.playerAvatar.username}!`);
            }
            break;
          case 'look_at_user':
            if (window.playerAvatar) {
              // Solo rota torso/cabeza
              this.mesh.lookAt(window.playerAvatar.mesh.position);
            }
            break;
          case 'speak':
            this.speech?.showMessage(data.message);
            break;
          case 'sleep':
            this._sleeping = true;
            this.playAnimation('sleeping');
            break;
          case 'wake':
            this._sleeping = false;
            this.playAnimation('idle');
            break;
        }
      });
    }
  }

  _idleBehavior(delta) {
    if (this._sleeping) return;
    this._idleTimer -= delta;
    if (this._idleTimer <= 0) {
      // Elige slot aleatorio y camina
      const slot = window.roomSlots?.[Math.floor(Math.random() * window.roomSlots.length)];
      if (slot) this.walkTo(slot.position);
      this._idleTimer = 30 + Math.random() * 30;
    }
    // Ocasionalmente mira al usuario
    if (window.playerAvatar && Math.random() < 0.01) {
      this.mesh.lookAt(window.playerAvatar.mesh.position);
    }
    // Si energy < 20, fuerza sleep
    if (this.agentData.energy < 20) {
      this._sleeping = true;
      this.playAnimation('sleeping');
    }
  }

  update(delta) {
    if (this.mixer) this.mixer.update(delta);
    if (this.path && !this._sleeping) this._followPath(delta);
    else this._idleBehavior(delta);
    // Speech bubble update
    if (this.speech) this.speech.update(this.mesh.position, this.camera);
  }
}

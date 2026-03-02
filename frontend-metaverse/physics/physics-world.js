// physics/physics-world.js
export class PhysicsWorld {
  constructor() {
    this.RAPIER = null;
    this.world = null;
    this.meshMap = new Map();
    this.lastPhysicsTime = performance.now();
    this.physicsInterval = 1000 / 60;
    this.prevPositions = new Map();
    this.currentPositions = new Map();
    this._init();
  }

  async _init() {
    this.RAPIER = await import('https://cdn.skypack.dev/@dimforge/rapier3d-compat');
    await this.RAPIER.init();
    this.world = new this.RAPIER.World({ x: 0, y: -9.81, z: 0 });
    this._startLoops();
  }

  _startLoops() {
    setInterval(() => this._physicsLoop(), this.physicsInterval);
    requestAnimationFrame(() => this._graphicsLoop());
  }

  _physicsLoop() {
    this.lastPhysicsTime = performance.now();
    this.world.step();
    // Guarda posiciones previas y actuales para interpolación
    for (const [mesh, rigidBody] of this.meshMap) {
      this.prevPositions.set(mesh, mesh.position.clone());
      const pos = rigidBody.translation();
      this.currentPositions.set(mesh, { x: pos.x, y: pos.y, z: pos.z });
    }
  }

  _graphicsLoop() {
    const alpha = (performance.now() - this.lastPhysicsTime) / this.physicsInterval;
    for (const [mesh, rigidBody] of this.meshMap) {
      const prev = this.prevPositions.get(mesh);
      const curr = this.currentPositions.get(mesh);
      if (prev && curr) {
        mesh.position.lerpVectors(prev, curr, Math.min(Math.max(alpha, 0), 1));
      }
    }
    requestAnimationFrame(() => this._graphicsLoop());
  }

  addStaticCollider(mesh) {
    // Convierte la geometría a TriMeshCollider
    const vertices = [];
    const indices = [];
    mesh.geometry.computeBoundingBox();
    const posAttr = mesh.geometry.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      vertices.push(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i));
    }
    for (let i = 0; i < posAttr.count; i += 3) {
      indices.push(i, i + 1, i + 2);
    }
    const colliderDesc = this.RAPIER.ColliderDesc.trimesh(vertices, indices);
    const rigidBodyDesc = this.RAPIER.RigidBodyDesc.fixed();
    const rigidBody = this.world.createRigidBody(rigidBodyDesc);
    this.world.createCollider(colliderDesc, rigidBody);
    this.meshMap.set(mesh, rigidBody);
  }

  createCharacterController(options) {
    // Implementación exacta del ejemplo oficial
    const { halfHeight, radius, offset } = options;
    const rigidBodyDesc = this.RAPIER.RigidBodyDesc.kinematicPositionBased();
    const rigidBody = this.world.createRigidBody(rigidBodyDesc);
    const colliderDesc = this.RAPIER.ColliderDesc.capsule(halfHeight, radius);
    const collider = this.world.createCollider(colliderDesc, rigidBody);
    const characterController = this.world.createCharacterController(offset);
    characterController.enableAutostep(0.3, 0.3, true);
    characterController.enableSnapToGround(0.5);
    characterController.setApplyImpulsesToDynamicBodies(true);

    return {
      rigidBody,
      collider,
      characterController,
      computeMovement: (desiredMovement) => {
        characterController.computeColliderMovement(collider, desiredMovement);
        const movement = characterController.computedMovement();
        const newPos = rigidBody.translation().clone().add(movement);
        rigidBody.setNextKinematicTranslation(newPos);
        return movement;
      }
    };
  }
}

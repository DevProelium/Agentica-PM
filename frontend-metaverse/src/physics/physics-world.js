/**
 * Physics world wrapper for Rapier (WASM).
 * Falls back gracefully if WASM is not available.
 */
export class PhysicsWorld {
  constructor() {
    this.world  = null;
    this.bodies = new Map();
  }

  async init() {
    try {
      const RAPIER = await import('https://cdn.skypack.dev/@dimforge/rapier3d-compat');
      await RAPIER.init();
      const gravity = { x: 0, y: -9.81, z: 0 };
      this.world = new RAPIER.World(gravity);
      this.RAPIER = RAPIER;
      console.log('[Physics] Rapier initialized');
    } catch (err) {
      console.warn('[Physics] Rapier not available, physics disabled', err.message);
    }
  }

  addStaticBox(x, y, z, hw, hh, hd) {
    if (!this.world || !this.RAPIER) return null;
    const colliderDesc = this.RAPIER.ColliderDesc.cuboid(hw, hh, hd);
    colliderDesc.setTranslation(x, y, z);
    return this.world.createCollider(colliderDesc);
  }

  addDynamicBox(id, x, y, z) {
    if (!this.world || !this.RAPIER) return null;
    const bodyDesc = this.RAPIER.RigidBodyDesc.dynamic().setTranslation(x, y, z);
    const body = this.world.createRigidBody(bodyDesc);
    const collider = this.RAPIER.ColliderDesc.cuboid(0.3, 0.75, 0.2);
    this.world.createCollider(collider, body);
    this.bodies.set(id, body);
    return body;
  }

  step(dt = 1 / 60) {
    this.world?.step();
  }

  getPosition(id) {
    const body = this.bodies.get(id);
    if (!body) return null;
    const t = body.translation();
    return { x: t.x, y: t.y, z: t.z };
  }
}

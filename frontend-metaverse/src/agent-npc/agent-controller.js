/**
 * AI Agent NPC: moves around the world and can be interacted with.
 */
export class AgentController {
  constructor(scene, THREE, agentData) {
    this.scene     = scene;
    this.THREE     = THREE;
    this.agentData = agentData;
    this.mesh      = null;
    this.speed     = 1.5;
    this.target    = { x: 0, z: 0 };
    this._nextMoveTimer = 0;
  }

  create() {
    const { BoxGeometry, MeshStandardMaterial, Mesh, Group, Color } = this.THREE;

    const group = new Group();

    // Body (agent-colored)
    const body = new Mesh(
      new BoxGeometry(0.6, 0.9, 0.4),
      new MeshStandardMaterial({ color: 0xa855f7 })
    );
    body.position.y = 0.45;
    body.castShadow = true;
    group.add(body);

    // Head
    const head = new Mesh(
      new BoxGeometry(0.5, 0.5, 0.5),
      new MeshStandardMaterial({ color: 0xfde68a })
    );
    head.position.y = 1.15;
    group.add(head);

    // Name tag (simplified as a point light)
    const { PointLight } = this.THREE;
    const light = new PointLight(0xa855f7, 0.5, 3);
    light.position.y = 2;
    group.add(light);

    group.position.set(
      (Math.random() - 0.5) * 20,
      0,
      (Math.random() - 0.5) * 20
    );

    this.mesh = group;
    this.scene.add(group);
    return group;
  }

  update(dt) {
    if (!this.mesh) return;

    this._nextMoveTimer -= dt;
    if (this._nextMoveTimer <= 0) {
      // Pick random new target
      this.target = {
        x: (Math.random() - 0.5) * 30,
        z: (Math.random() - 0.5) * 30,
      };
      this._nextMoveTimer = 3 + Math.random() * 5;
    }

    // Move toward target
    const dx = this.target.x - this.mesh.position.x;
    const dz = this.target.z - this.mesh.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist > 0.1) {
      this.mesh.position.x += (dx / dist) * this.speed * dt;
      this.mesh.position.z += (dz / dist) * this.speed * dt;
      this.mesh.rotation.y  = Math.atan2(dx, dz);
    }
  }

  destroy() {
    if (this.mesh) this.scene.remove(this.mesh);
  }
}

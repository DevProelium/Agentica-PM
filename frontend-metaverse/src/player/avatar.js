const THREE_CDN = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

/**
 * Player avatar representation.
 */
export class Avatar {
  constructor(scene, THREE, options = {}) {
    this.scene   = scene;
    this.THREE   = THREE;
    this.options = options;
    this.mesh    = null;
  }

  create() {
    const { BoxGeometry, MeshStandardMaterial, Mesh, Group, Color } = this.THREE;

    const group = new Group();

    // Body
    const body = new Mesh(
      new BoxGeometry(0.6, 0.9, 0.4),
      new MeshStandardMaterial({ color: this.options.color || 0xe94560 })
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
    head.castShadow = true;
    group.add(head);

    this.mesh = group;
    this.scene.add(group);
    return group;
  }

  setPosition(x, y, z) {
    this.mesh?.position.set(x, y, z);
  }

  setRotation(y) {
    if (this.mesh) this.mesh.rotation.y = y;
  }

  playAnimation(name) {
    // Placeholder for animation state machine
  }

  destroy() {
    if (this.mesh) this.scene.remove(this.mesh);
  }
}

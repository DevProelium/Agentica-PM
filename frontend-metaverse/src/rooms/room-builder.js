/**
 * Procedural room builder: generate room geometry from a JSON config.
 */
export class RoomBuilder {
  constructor(scene, THREE) {
    this.scene = scene;
    this.THREE = THREE;
  }

  buildFromConfig(config = {}) {
    const { width = 20, depth = 20, height = 6, wallColor = 0x1a1a2e, floorColor = 0x111128 } = config;
    const { BoxGeometry, MeshStandardMaterial, Mesh } = this.THREE;

    const wallMat  = new MeshStandardMaterial({ color: wallColor });
    const floorMat = new MeshStandardMaterial({ color: floorColor });

    // Floor
    const floor = new Mesh(new BoxGeometry(width, 0.2, depth), floorMat);
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Ceiling
    const ceiling = new Mesh(new BoxGeometry(width, 0.2, depth), wallMat);
    ceiling.position.y = height;
    this.scene.add(ceiling);

    // Walls
    const wallDefs = [
      { pos: [0, height/2, -depth/2],   size: [width, height, 0.2] },
      { pos: [0, height/2,  depth/2],   size: [width, height, 0.2] },
      { pos: [-width/2, height/2, 0],   size: [0.2, height, depth] },
      { pos: [ width/2, height/2, 0],   size: [0.2, height, depth] },
    ];

    for (const { pos, size } of wallDefs) {
      const wall = new Mesh(new BoxGeometry(...size), wallMat);
      wall.position.set(...pos);
      wall.receiveShadow = true;
      this.scene.add(wall);
    }

    // Furniture from config
    for (const item of config.furniture || []) {
      this._placeFurniture(item);
    }
  }

  _placeFurniture(item) {
    const { BoxGeometry, MeshStandardMaterial, Mesh } = this.THREE;
    const mesh = new Mesh(
      new BoxGeometry(item.width || 1, item.height || 1, item.depth || 1),
      new MeshStandardMaterial({ color: item.color || 0x444466 })
    );
    mesh.position.set(item.x || 0, (item.height || 1) / 2, item.z || 0);
    mesh.castShadow  = true;
    mesh.receiveShadow = true;
    this.scene.add(mesh);
  }
}

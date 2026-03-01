const THREE_CDN = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const ROOM_PRESETS = {
  lobby: {
    walls:   0x1a1a2e,
    floor:   0x111128,
    ceiling: 0x0d0d1a,
    objects: [
      { type: 'box', pos: [5, 1, 5],   size: [2, 2, 2], color: 0x3b82f6 },
      { type: 'box', pos: [-5, 1, 5],  size: [2, 2, 2], color: 0xa855f7 },
      { type: 'box', pos: [5, 1, -5],  size: [2, 2, 2], color: 0xe94560 },
      { type: 'box', pos: [-5, 1, -5], size: [2, 2, 2], color: 0xfbbf24 },
    ],
  },
  garden: {
    walls:   0x064e3b,
    floor:   0x166534,
    ceiling: 0x0c4a6e,
    objects: [],
  },
};

/**
 * Load a room configuration and build geometry.
 */
export class RoomLoader {
  constructor(scene, THREE) {
    this.scene = scene;
    this.THREE = THREE;
  }

  loadPreset(name = 'lobby') {
    const preset = ROOM_PRESETS[name] || ROOM_PRESETS.lobby;
    this._buildRoom(preset);
  }

  _buildRoom(preset) {
    const { BoxGeometry, MeshStandardMaterial, Mesh, Color } = this.THREE;

    // Floor
    const floor = new Mesh(
      new BoxGeometry(40, 0.2, 40),
      new MeshStandardMaterial({ color: preset.floor })
    );
    floor.position.y = -0.1;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Objects
    for (const obj of preset.objects) {
      const [sx, sy, sz] = obj.size;
      const mesh = new Mesh(
        new BoxGeometry(sx, sy, sz),
        new MeshStandardMaterial({ color: obj.color })
      );
      mesh.position.set(...obj.pos);
      mesh.castShadow = true;
      this.scene.add(mesh);
    }
  }
}

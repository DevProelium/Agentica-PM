/**
 * Skin system: maps skin keys to colors/materials.
 */
export const SKINS = {
  default:  { color: 0xe94560, name: 'Default' },
  blue:     { color: 0x3b82f6, name: 'Classic Blue' },
  orange:   { color: 0xf97316, name: 'Sunset Orange' },
  purple:   { color: 0xa855f7, name: 'Galaxy Purple' },
  gold:     { color: 0xfbbf24, name: 'Golden Aura' },
};

export function getSkin(key) {
  return SKINS[key] || SKINS.default;
}

export function applySkin(mesh, skinKey) {
  const skin = getSkin(skinKey);
  if (mesh?.material) {
    mesh.material.color?.setHex(skin.color);
  }
}

import { Avatar } from '../player/avatar.js';

export class Visitors {
  constructor(scene, THREE, physicsWorld) {
    this.scene = scene;
    this.THREE = THREE;
    this.physicsWorld = physicsWorld;
    this.avatars = new Map();
    this._initWS();
  }

  _initWS() {
    const wsClient = window.wsClient;
    wsClient.on('meta:user_joined', data => {
      if (this.avatars.has(data.userId)) return;
      const avatar = new Avatar(this.scene, this.THREE, {
        id: data.userId,
        username: data.username,
        avatarUrl: data.avatarUrl,
      });
      avatar.mesh.position.copy(data.position);
      this.avatars.set(data.userId, avatar);
    });

    wsClient.on('meta:user_moved', data => {
      const avatar = this.avatars.get(data.userId);
      if (avatar) {
        // Lerp position for smooth movement
        avatar.targetPos = data.position;
        avatar.targetRot = data.rotation;
        avatar.isWalking = true;
      }
    });

    wsClient.on('meta:user_left', data => {
      const avatar = this.avatars.get(data.userId);
      if (avatar) {
        this.scene.remove(avatar.mesh);
        this.avatars.delete(data.userId);
      }
    });

    wsClient.on('meta:user_emote', data => {
      const avatar = this.avatars.get(data.userId);
      if (avatar) avatar.playEmote(data.emote);
    });
  }

  update(delta) {
    this.avatars.forEach(avatar => {
      if (avatar.targetPos) {
        avatar.mesh.position.lerp(avatar.targetPos, 0.2);
        avatar.mesh.rotation.y += (avatar.targetRot - avatar.mesh.rotation.y) * 0.2;
        if (avatar.mesh.position.distanceTo(avatar.targetPos) < 0.05) {
          avatar.isWalking = false;
        }
        avatar.playAnimation(avatar.isWalking ? 'walk' : 'idle');
      }
    });
  }
}

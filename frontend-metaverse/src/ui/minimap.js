export class Minimap {
  constructor(world) {
    this.world = world;
    this.canvas = document.createElement('canvas');
    this.canvas.width = 120; this.canvas.height = 120;
    this.canvas.style = 'position:fixed;top:16px;right:40px;z-index:30;border-radius:10px;background:#222;';
    document.body.appendChild(this.canvas);
  }

  update() {
    const ctx = this.canvas.getContext('2d');
    ctx.clearRect(0,0,120,120);
    // Draw room bounds
    ctx.strokeStyle = '#444';
    ctx.strokeRect(10,10,100,100);
    // Draw furniture (simplified)
    this.world.roomMeshes?.forEach(obj => {
      ctx.fillStyle = '#666';
      ctx.fillRect(10+obj.position.x, 10+obj.position.z, 8, 8);
    });
    // Draw avatars
    if (this.world.avatar) {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(60+this.world.avatar.mesh.position.x, 60+this.world.avatar.mesh.position.z, 5, 0, Math.PI*2);
      ctx.fill();
    }
    if (this.world.agentNPC) {
      ctx.fillStyle = '#FF6B6B';
      ctx.beginPath();
      ctx.arc(60+this.world.agentNPC.mesh.position.x, 60+this.world.agentNPC.mesh.position.z, 5, 0, Math.PI*2);
      ctx.fill();
    }
    // Other users
    this.world.visitors?.forEach(v => {
      ctx.fillStyle = v.color;
      ctx.beginPath();
      ctx.arc(60+v.mesh.position.x, 60+v.mesh.position.z, 4, 0, Math.PI*2);
      ctx.fill();
    });
  }
}

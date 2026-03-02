export function showAchievementToast(achievement) {
  // Partículas doradas
  const pool = [];
  for (let i = 0; i < 50; i++) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xffd700 })
    );
    mesh.position.copy(window.playerAvatar.mesh.position);
    mesh.visible = false;
    window.scene.add(mesh);
    pool.push(mesh);
  }
  // Explosión animada
  pool.forEach((m, i) => {
    setTimeout(() => {
      m.visible = true;
      m.position.x += Math.random() * 1.5 - 0.75;
      m.position.y += Math.random() * 1.5;
      m.position.z += Math.random() * 1.5 - 0.75;
      setTimeout(() => { m.visible = false; }, 1200);
    }, i * 20);
  });

  // Panel flotante
  const panel = document.createElement('div');
  panel.style = `
    position:fixed;top:40%;left:50%;transform:translate(-50%,-50%);
    background:rgba(255,255,255,0.96);border-radius:16px;padding:24px 32px;
    box-shadow:0 8px 32px #ffd70088;z-index:1000;text-align:center;
    font-size:18px;color:#a855f7;animation:fade-in 0.3s;
  `;
  panel.innerHTML = `
    <div style="font-size:48px">${achievement.icon}</div>
    <div style="font-weight:700;font-size:22px">${achievement.name}</div>
    <div style="color:#222;margin:8px 0">${achievement.description}</div>
    <div style="font-size:20px;color:#ffd700;margin-top:8px">+ ${achievement.reward} Cristales</div>
  `;
  document.body.appendChild(panel);
  let n = 0;
  const numEl = panel.querySelector('div:last-child');
  const interval = setInterval(() => {
    if (n < achievement.reward) numEl.textContent = `+ ${++n} Cristales`;
    else clearInterval(interval);
  }, 30);
  setTimeout(() => panel.remove(), 5000);
}

// Integración:
import { on } from '../core/ws-client.js';
on('achievement:unlocked', ({ achievement }) => showAchievementToast(achievement));

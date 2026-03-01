export class WorldBuilder {
  constructor(container) {
    this.container = container;
    this.grid = Array(8).fill(null).map(() => Array(8).fill(0));
    this.selected = 1;
  }

  start() {
    this.render();
  }

  render() {
    const tiles = ['⬜','🟩','🌊','🪨','🌲','🏠','⭐','🔥'];
    this.container.innerHTML = `
      <h3 style="margin-bottom:12px">🏗️ World Builder</h3>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">
        ${tiles.map((t,i) => `
          <button data-tile="${i}" style="font-size:24px;padding:6px;border:2px solid ${this.selected===i?'#e94560':'transparent'};
            border-radius:6px;background:rgba(255,255,255,0.05);cursor:pointer">${t}</button>
        `).join('')}
      </div>
      <div id="world-grid" style="display:inline-grid;grid-template-columns:repeat(8,36px);gap:2px">
        ${this.grid.map((row, r) =>
          row.map((cell, c) => `
            <button data-r="${r}" data-c="${c}" style="
              width:36px;height:36px;border:none;border-radius:4px;cursor:pointer;
              background:rgba(255,255,255,0.04);font-size:18px">
              ${tiles[cell]}
            </button>
          `).join('')
        ).join('')}
      </div>
    `;

    this.container.querySelectorAll('[data-tile]').forEach(btn => {
      btn.addEventListener('click', () => { this.selected = parseInt(btn.dataset.tile); this.render(); });
    });

    this.container.querySelectorAll('[data-r]').forEach(btn => {
      btn.addEventListener('click', () => {
        const r = parseInt(btn.dataset.r), c = parseInt(btn.dataset.c);
        this.grid[r][c] = this.selected;
        this.render();
      });
    });
  }
}

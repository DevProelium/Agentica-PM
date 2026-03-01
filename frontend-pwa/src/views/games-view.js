export default async function GamesView() {
  function render(container) {
    container.style.cssText = 'padding:64px 16px 80px;min-height:100dvh;';
    container.innerHTML = `
      <h2 style="margin-bottom:16px">Games</h2>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        ${gameCard('trivia',  '🧠', 'Trivia',      'Test your knowledge')}
        ${gameCard('word',    '📝', 'Word Game',   'Vocabulary challenge')}
        ${gameCard('builder', '🏗️', 'World Builder','Build together')}
      </div>
    `;

    container.querySelectorAll('[data-game]').forEach(card => {
      card.addEventListener('click', () => launchGame(card.dataset.game, container));
    });
  }

  function gameCard(id, icon, name, desc) {
    return `
      <div data-game="${id}" style="
        padding:20px;background:rgba(255,255,255,0.04);border-radius:12px;
        border:1px solid rgba(255,255,255,0.06);cursor:pointer;text-align:center">
        <div style="font-size:36px;margin-bottom:8px">${icon}</div>
        <p style="font-weight:600;margin-bottom:4px">${name}</p>
        <p style="font-size:11px;color:#8892a4">${desc}</p>
      </div>
    `;
  }

  async function launchGame(type, container) {
    const { default: gamesModule } = await import('../modules/games/index.js');
    gamesModule.launch(type, container);
  }

  return { render };
}

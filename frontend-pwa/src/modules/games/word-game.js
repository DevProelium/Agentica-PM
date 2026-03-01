const WORDS = ['APPLE','BRAIN','CLOUD','DREAM','FLAME','GRACE','HEART','IVORY'];

export class WordGame {
  constructor(container) {
    this.container = container;
    this.word    = WORDS[Math.floor(Math.random() * WORDS.length)];
    this.guesses = [];
    this.maxTries = 6;
  }

  start() {
    this.render();
  }

  render() {
    const guessStr = this.word.split('').map((_, i) =>
      this.guesses.includes(this.word[i]) ? this.word[i] : '_'
    ).join(' ');

    const won = !guessStr.includes('_');
    const lost = !won && this.guesses.length >= this.maxTries;

    this.container.innerHTML = `
      <h3 style="margin-bottom:12px">🔡 Word Game</h3>
      <p style="font-size:24px;letter-spacing:6px;font-weight:700;margin-bottom:12px">${guessStr}</p>
      <p style="color:#8892a4;font-size:13px;margin-bottom:16px">
        Tries left: ${this.maxTries - this.guesses.length} |
        Guessed: ${this.guesses.join(', ')||'—'}
      </p>
      ${won  ? '<p style="color:#4ade80;font-size:20px">🎉 You won!</p>' : ''}
      ${lost ? `<p style="color:#e94560">The word was: <strong>${this.word}</strong></p>` : ''}
      ${!won && !lost ? `
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(l => `
            <button data-l="${l}" ${this.guesses.includes(l)?'disabled':''} style="
              padding:8px;min-width:36px;background:${this.guesses.includes(l)?'rgba(255,255,255,0.03)':'rgba(255,255,255,0.08)'};
              border:1px solid rgba(255,255,255,0.1);border-radius:6px;color:#eaeaea;cursor:pointer;font-size:13px">
              ${l}
            </button>
          `).join('')}
        </div>` : ''}
    `;

    this.container.querySelectorAll('[data-l]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.guesses.push(btn.dataset.l);
        this.render();
      });
    });
  }
}

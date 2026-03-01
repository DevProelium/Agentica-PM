export class TriviaGame {
  constructor(container) {
    this.container = container;
    this.score  = 0;
    this.index  = 0;
    this.questions = [
      { q: 'What is 2 + 2?',            options: ['3','4','5','6'],          answer: 1 },
      { q: 'Capital of France?',         options: ['Berlin','Paris','Rome','Madrid'], answer: 1 },
      { q: 'Largest planet?',            options: ['Earth','Mars','Jupiter','Saturn'], answer: 2 },
      { q: 'H₂O is…?',                  options: ['Oxygen','Hydrogen','Water','Salt'], answer: 2 },
      { q: 'How many sides does a triangle have?', options: ['2','3','4','5'], answer: 1 },
    ];
  }

  start() {
    this.renderQuestion();
  }

  renderQuestion() {
    if (this.index >= this.questions.length) {
      this.renderResult();
      return;
    }
    const q = this.questions[this.index];
    this.container.innerHTML = `
      <h3 style="margin-bottom:12px;font-size:1rem">Q${this.index+1}/${this.questions.length}: ${q.q}</h3>
      <p style="font-size:12px;color:#8892a4;margin-bottom:16px">Score: ${this.score}</p>
      <div style="display:flex;flex-direction:column;gap:8px">
        ${q.options.map((o,i) => `
          <button data-i="${i}" style="padding:12px 16px;background:rgba(255,255,255,0.06);
            border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:#eaeaea;cursor:pointer;
            text-align:left;font-size:14px">${o}</button>
        `).join('')}
      </div>
    `;
    this.container.querySelectorAll('[data-i]').forEach(btn => {
      btn.addEventListener('click', () => {
        const chosen = parseInt(btn.dataset.i);
        if (chosen === q.answer) this.score++;
        this.index++;
        this.renderQuestion();
      });
    });
  }

  renderResult() {
    this.container.innerHTML = `
      <div style="text-align:center;padding:24px">
        <p style="font-size:48px;margin-bottom:12px">${this.score >= 4 ? '🏆' : this.score >= 2 ? '😊' : '😅'}</p>
        <h3 style="margin-bottom:8px">Score: ${this.score}/${this.questions.length}</h3>
        <p style="color:#8892a4;margin-bottom:16px">${this.score >= 4 ? 'Excellent!' : 'Good try!'}</p>
        <button onclick="location.reload()" style="padding:10px 20px;background:#e94560;border:none;border-radius:8px;color:#fff;cursor:pointer">Play Again</button>
      </div>
    `;
  }
}

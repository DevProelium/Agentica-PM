import { TriviaGame }    from './trivia.js';
import { WordGame }      from './word-game.js';
import { WorldBuilder }  from './world-builder.js';

export const gamesModule = {
  launch(type, container) {
    container.innerHTML = `<div id="game-frame" style="padding:64px 16px 80px;min-height:100dvh;"></div>`;
    const frame = container.querySelector('#game-frame');

    const back = document.createElement('button');
    back.textContent = '← Back';
    Object.assign(back.style, {
      marginBottom: '16px',
      padding: '8px 16px',
      background: 'rgba(255,255,255,0.06)',
      border: 'none',
      borderRadius: '8px',
      color: '#eaeaea',
      cursor: 'pointer',
    });
    frame.appendChild(back);
    back.addEventListener('click', () => {
      import('../../core/router.js').then(m => m.navigate('games'));
    });

    const gameEl = document.createElement('div');
    frame.appendChild(gameEl);

    switch (type) {
      case 'trivia':  new TriviaGame(gameEl).start();   break;
      case 'word':    new WordGame(gameEl).start();     break;
      case 'builder': new WorldBuilder(gameEl).start(); break;
    }
  },
};

export default gamesModule;

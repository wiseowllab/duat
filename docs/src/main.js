import { GAME_HEIGHT, GAME_WIDTH } from './data/constants.js';
import { GameScene } from './scenes/GameScene.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#080704',
  scene: [GameScene],
  pixelArt: true,
};

new Phaser.Game(config);

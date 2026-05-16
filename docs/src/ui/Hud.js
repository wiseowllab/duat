import { CELL_SIZE } from '../data/constants.js';
import { PIECE_COLORS, PIECE_LABELS } from '../data/pieces.js';

export class Hud {
  constructor(scene, x, y) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.nextBlocks = [];

    this.create();
  }

  create() {
    this.scene.add.text(this.x, this.y, 'DUAT', {
      fontFamily: 'Georgia, serif',
      fontSize: '30px',
      color: '#d4af37',
      fontStyle: 'bold',
    });

    this.scoreText = this.createLabel(0, 58, 'Score: 0');
    this.levelText = this.createLabel(0, 86, 'Level: 1');
    this.statusText = this.createLabel(0, 420, '← → Move\n↓ Soft drop\n↑ / Z Rotate\nSpace Hard drop', 16);

    this.scene.add.text(this.x, this.y + 136, 'NEXT', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      color: '#f3e2a0',
      fontStyle: 'bold',
    });
  }

  createLabel(offsetX, offsetY, text, fontSize = 18) {
    return this.scene.add.text(this.x + offsetX, this.y + offsetY, text, {
      fontFamily: 'Arial, sans-serif',
      fontSize: `${fontSize}px`,
      color: '#eadfca',
      lineSpacing: 8,
    });
  }

  updateScore(score) {
    this.scoreText.setText(`Score: ${score}`);
  }

  updateLevel(level) {
    this.levelText.setText(`Level: ${level}`);
  }

  showGameOver() {
    this.statusText.setText('Game Over\nRefresh to restart');
    this.statusText.setColor('#ff7b7b');
  }

  drawNext(types) {
    this.clearNext();

    const startX = this.x + 26;
    const startY = this.y + 180;

    types.forEach((type, index) => {
      const y = startY + index * (CELL_SIZE + 8);
      const block = this.scene.add.rectangle(startX, y, CELL_SIZE, CELL_SIZE, PIECE_COLORS[type])
        .setStrokeStyle(2, 0x2a1b10);
      const label = this.scene.add.text(startX + 34, y - 10, PIECE_LABELS[type], {
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        color: '#eadfca',
      });

      this.nextBlocks.push(block, label);
    });
  }

  clearNext() {
    this.nextBlocks.forEach((item) => item.destroy());
    this.nextBlocks = [];
  }
}

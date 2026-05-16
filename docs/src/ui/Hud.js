import { CELL_SIZE } from '../data/constants.js';
import { getPieceAsset, PIECE_COLORS, PIECE_LABELS } from '../data/pieces.js';

export class Hud {
  constructor(scene, x, y) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.nextBlocks = [];
    this.feedbackTimer = null;

    this.create();
  }

  create() {
    this.createPanels();

    this.scene.add.text(this.x + 18, this.y + 16, 'DUAT', {
      fontFamily: 'Georgia, serif',
      fontSize: '30px',
      color: '#d4af37',
      fontStyle: 'bold',
    });

    this.scoreText = this.createLabel(20, 70, 'Score: 0');
    this.chainText = this.createLabel(20, 100, 'Chain: 0');
    this.levelText = this.createLabel(20, 130, 'Level: 1');
    this.feedbackText = this.createLabel(20, 330, '', 20);
    this.feedbackText.setColor('#f4d77a');
    this.feedbackText.setFontStyle('bold');
    this.statusText = this.createLabel(20, 414, '← → Move\n↓ Soft drop\n↑ / Z Rotate\nSpace Hard drop', 15);

    this.scene.add.text(this.x + 20, this.y + 178, 'NEXT', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      color: '#f3e2a0',
      fontStyle: 'bold',
    });
  }

  createPanels() {
    this.scene.add.rectangle(this.x + 82, this.y + 226, 174, 430, 0x21160d, 0.86)
      .setStrokeStyle(1, 0xd4af37, 0.42);
    this.scene.add.rectangle(this.x + 82, this.y + 108, 146, 124, 0x0d0b08, 0.72)
      .setStrokeStyle(1, 0x8b7446, 0.28);
    this.scene.add.rectangle(this.x + 82, this.y + 248, 146, 132, 0x0d0b08, 0.72)
      .setStrokeStyle(1, 0x8b7446, 0.28);
    this.scene.add.rectangle(this.x + 82, this.y + 354, 146, 72, 0x0d0b08, 0.62)
      .setStrokeStyle(1, 0xd4af37, 0.22);
    this.scene.add.rectangle(this.x + 82, this.y + 450, 146, 86, 0x0d0b08, 0.54)
      .setStrokeStyle(1, 0x8b7446, 0.2);
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

  updateChain(chainCount) {
    this.chainText.setText(`Chain: ${chainCount}`);
  }

  updateLevel(level) {
    this.levelText.setText(`Level: ${level}`);
  }

  showCanopicSet() {
    this.showClearFeedback(false, true, 0);
  }

  showClearFeedback(clearedSameType, clearedCanopicSet, chainCount) {
    const messages = [];

    if (clearedSameType) {
      messages.push('CLEAR!');
    }

    if (clearedCanopicSet) {
      messages.push('CANOPIC SET!');
    }

    if (chainCount >= 2) {
      messages.push(`CHAIN x${chainCount}`);
    }

    this.feedbackText.setText(messages.join('\n'));

    if (this.feedbackTimer) {
      this.feedbackTimer.remove(false);
    }

    this.feedbackTimer = this.scene.time.delayedCall(1400, () => {
      this.feedbackText.setText('');
    });
  }

  showGameOver() {
    this.statusText.setText('Game Over\nRefresh to restart');
    this.statusText.setColor('#ff7b7b');
  }

  drawNext(types) {
    this.clearNext();

    const startX = this.x + 44;
    const startY = this.y + 224;

    types.forEach((type, index) => {
      const y = startY + index * (CELL_SIZE + 10);
      const block = this.drawNextBlock(startX, y, type);
      const label = this.scene.add.text(startX + 34, y - 10, PIECE_LABELS[type], {
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        color: '#eadfca',
      });

      this.nextBlocks.push(block, label);
    });
  }

  drawNextBlock(x, y, type) {
    const asset = getPieceAsset(type);

    const container = this.scene.add.container(x, y);
    const shadow = this.scene.add.ellipse(2, 4, CELL_SIZE - 8, CELL_SIZE - 8, 0x000000, 0.28);
    const fallbackBlock = this.scene.add.rectangle(0, 0, CELL_SIZE - 8, CELL_SIZE - 8, PIECE_COLORS[type], 0.32)
      .setStrokeStyle(1, 0xf6e3a1, 0.32);

    container.add([shadow, fallbackBlock]);

    if (asset && this.scene.textures.exists(asset.key)) {
      const image = this.scene.add.image(0, 0, asset.key)
        .setDisplaySize(CELL_SIZE - 10, CELL_SIZE - 10);
      container.add(image);
    }

    return container;
  }

  clearNext() {
    this.nextBlocks.forEach((item) => item.destroy());
    this.nextBlocks = [];
  }
}

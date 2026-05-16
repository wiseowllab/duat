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

    this.scoreText = this.createLabel(20, 68, 'Score: 0');
    this.chainText = this.createLabel(20, 96, 'Chain: 0');
    this.levelText = this.createLabel(20, 124, 'Level: 1', 15);

    this.scene.add.text(this.x + 20, this.y + 158, 'NEXT', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      color: '#f3e2a0',
      fontStyle: 'bold',
    });

    this.scene.add.text(this.x + 20, this.y + 288, 'COFFIN', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      color: '#f3e2a0',
      fontStyle: 'bold',
    });
    this.tierText = this.createLabel(20, 314, 'Tier 1 — Small Coffin', 14);
    this.godText = this.createLabel(20, 336, 'God: Imsety', 14);
    this.coffinText = this.createLabel(20, 358, 'Coffin: 0 / 1000', 14);
    this.unlockedText = this.createLabel(20, 380, 'Unlocked: 0 / 14', 14);
    this.coffinBarBack = this.scene.add.rectangle(this.x + 20, this.y + 410, 120, 14, 0x0b0906, 0.92)
      .setOrigin(0, 0.5)
      .setStrokeStyle(1, 0xd4af37, 0.46);
    this.coffinBarFill = this.scene.add.rectangle(this.x + 21, this.y + 410, 0, 10, 0xd4af37, 0.82)
      .setOrigin(0, 0.5);

    this.feedbackText = this.createLabel(20, 432, '', 18);
    this.feedbackText.setColor('#f4d77a');
    this.feedbackText.setFontStyle('bold');
    this.statusText = this.createLabel(20, 500, '←/→ Move   ↓ Soft\n↑/Z Rotate  Space Drop', 14);
  }

  createPanels() {
    this.scene.add.rectangle(this.x + 82, this.y + 270, 174, 514, 0x21160d, 0.86)
      .setStrokeStyle(1, 0xd4af37, 0.42);
    this.scene.add.rectangle(this.x + 82, this.y + 104, 146, 118, 0x0d0b08, 0.72)
      .setStrokeStyle(1, 0x8b7446, 0.28);
    this.scene.add.rectangle(this.x + 82, this.y + 218, 146, 120, 0x0d0b08, 0.72)
      .setStrokeStyle(1, 0x8b7446, 0.28);
    this.scene.add.rectangle(this.x + 82, this.y + 358, 146, 146, 0x0d0b08, 0.72)
      .setStrokeStyle(1, 0xd4af37, 0.28);
    this.scene.add.rectangle(this.x + 82, this.y + 458, 146, 54, 0x0d0b08, 0.62)
      .setStrokeStyle(1, 0xd4af37, 0.22);
    this.scene.add.rectangle(this.x + 82, this.y + 530, 146, 70, 0x0d0b08, 0.54)
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

  updateCoffin(state) {
    const { currentGod, currentTier, progress, unlockedCount, totalGods, isComplete } = state;

    if (isComplete) {
      this.tierText.setText('Tier 4 — Duat Complete');
      this.godText.setText('God: All Awakened');
      this.coffinText.setText('Coffin: Complete');
    } else {
      this.tierText.setText(`Tier ${currentTier.tier} — ${currentTier.tierName}`);
      this.godText.setText(`God: ${currentGod.name}`);
      this.coffinText.setText(`Coffin: ${progress.value} / ${progress.required}`);
    }

    this.unlockedText.setText(`Unlocked: ${unlockedCount} / ${totalGods}`);
    this.updateCoffinBar(progress.ratio);
  }

  updateCoffinBar(ratio) {
    const clampedRatio = Phaser.Math.Clamp(ratio, 0, 1);
    this.coffinBarFill.setDisplaySize(118 * clampedRatio, 10);
    this.coffinBarFill.setVisible(clampedRatio > 0);
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

    this.showFeedback(messages.join('\n'), 1400);
  }

  showGodUnlocked(unlockEvents) {
    const latestUnlock = unlockEvents[unlockEvents.length - 1];
    const suffix = latestUnlock.isComplete ? '\nDUAT COMPLETE' : '';
    this.showFeedback(`GOD UNLOCKED!\n${latestUnlock.god.name}${suffix}`, 2200);
  }

  showFeedback(message, durationMs) {
    this.feedbackText.setText(message);

    if (this.feedbackTimer) {
      this.feedbackTimer.remove(false);
    }

    this.feedbackTimer = this.scene.time.delayedCall(durationMs, () => {
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
    const startY = this.y + 204;

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

import { CELL_SIZE } from '../data/constants.js';
import { getCoffinAsset } from '../data/coffins.js';
import { getPieceAsset, PIECE_COLORS, PIECE_LABELS } from '../data/pieces.js';

export class Hud {
  constructor(scene, x, y) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.nextBlocks = [];
    this.feedbackTimer = null;
    this.coffinContainer = null;
    this.coffinGlow = null;
    this.coffinGlowTween = null;

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
    this.tierText = this.createLabel(20, 314, 'Tier 1 — Small Coffin', 13);
    this.godText = this.createLabel(20, 336, 'God: Imsety', 13);
    this.coffinText = this.createLabel(20, 376, 'Meter: 0 / 1000', 13);
    this.unlockedText = this.createLabel(20, 394, 'Unlocked: 0 / 14', 13);
    this.drawCoffinVisual({ tier: 1, tierName: 'Small Coffin', coffinSize: 'small' });
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
      this.coffinText.setText('Meter: Complete');
      this.drawCoffinVisual(currentTier);
    } else {
      this.tierText.setText(`Tier ${currentTier.tier} — ${currentTier.tierName}`);
      this.godText.setText(`God: ${currentGod.name}`);
      this.coffinText.setText(`Meter: ${progress.value} / ${progress.required}`);
      this.drawCoffinVisual(currentTier);
    }

    this.unlockedText.setText(`Unlocked: ${unlockedCount} / ${totalGods}`);
    this.updateCoffinBar(progress.ratio);
  }

  drawCoffinVisual(currentTier) {
    if (this.coffinContainer) {
      this.coffinContainer.destroy(true);
    }

    const asset = getCoffinAsset(currentTier.coffinSize);
    const centerX = this.x + 108;
    const centerY = this.y + 350;
    const container = this.scene.add.container(centerX, centerY);
    const glowSize = Math.max(asset.maxDisplayWidth, asset.maxDisplayHeight) + 18;

    this.coffinGlow = this.scene.add.ellipse(0, 0, glowSize, glowSize, 0xd4af37, 0.08)
      .setStrokeStyle(2, 0xf4d77a, 0.16);
    const coffin = this.createCoffinDisplay(asset, currentTier.tier);

    container.add([this.coffinGlow, coffin]);
    this.coffinContainer = container;
  }

  createCoffinDisplay(asset, tier) {
    if (!asset || !this.scene.textures.exists(asset.key)) {
      return this.createCoffinGraphic({
        width: asset?.fallbackWidth ?? 32,
        height: asset?.fallbackHeight ?? 42,
        tier,
      });
    }

    const source = this.scene.textures.get(asset.key).getSourceImage();
    const scale = Math.min(
      asset.maxDisplayWidth / source.width,
      asset.maxDisplayHeight / source.height,
    );

    return this.scene.add.image(0, 0, asset.key)
      .setDisplaySize(source.width * scale, source.height * scale);
  }

  createCoffinGraphic(visual) {
    const { width, height, tier } = visual;
    const halfW = width / 2;
    const halfH = height / 2;
    const shoulderY = -halfH + height * 0.24;
    const footY = halfH - 6;
    const graphics = this.scene.add.graphics();
    const bodyPoints = [
      { x: -width * 0.24, y: -halfH },
      { x: width * 0.24, y: -halfH },
      { x: halfW, y: shoulderY },
      { x: halfW * 0.82, y: footY },
      { x: width * 0.28, y: halfH },
      { x: -width * 0.28, y: halfH },
      { x: -halfW * 0.82, y: footY },
      { x: -halfW, y: shoulderY },
    ];

    graphics.fillStyle(0x3a2a1a, 1);
    graphics.lineStyle(3, 0xd4af37, 1);
    graphics.fillPoints(bodyPoints, true);
    graphics.strokePoints(bodyPoints, true);

    graphics.lineStyle(1, 0xf4d77a, 0.78);
    graphics.strokeEllipse(0, -halfH + 12, width * 0.36, height * 0.18);
    graphics.lineBetween(0, -halfH + 22, 0, halfH - 10);

    if (tier >= 2) {
      this.drawCoffinBands(graphics, width, height);
    }

    if (tier >= 3) {
      this.drawCoffinJewels(graphics, width, height);
    }

    if (tier >= 4) {
      this.drawMaximumCoffinOrnaments(graphics, width, height);
    }

    return graphics;
  }

  drawCoffinBands(graphics, width, height) {
    const halfW = width / 2;
    const bandYs = [-height * 0.12, height * 0.16];

    graphics.lineStyle(2, 0xd4af37, 0.86);
    bandYs.forEach((y) => {
      graphics.lineBetween(-halfW * 0.62, y, halfW * 0.62, y);
    });
  }

  drawCoffinJewels(graphics, width, height) {
    const halfW = width / 2;
    const jewelYs = [-height * 0.24, 0, height * 0.24];

    graphics.fillStyle(0x2d7f87, 0.9);
    jewelYs.forEach((y) => {
      graphics.fillCircle(-halfW * 0.5, y, 2);
      graphics.fillCircle(halfW * 0.5, y, 2);
    });

    graphics.fillStyle(0xd4af37, 0.96);
    graphics.fillTriangle(0, -height * 0.33, 4, -height * 0.23, -4, -height * 0.23);
  }

  drawMaximumCoffinOrnaments(graphics, width, height) {
    const halfW = width / 2;
    const halfH = height / 2;

    graphics.lineStyle(1, 0xf4d77a, 0.9);
    graphics.strokeEllipse(0, 0, width * 0.72, height * 0.72);
    graphics.lineStyle(2, 0xd4af37, 0.82);
    graphics.lineBetween(-halfW - 5, -halfH + 12, -halfW - 12, -halfH + 4);
    graphics.lineBetween(halfW + 5, -halfH + 12, halfW + 12, -halfH + 4);
    graphics.lineBetween(-halfW - 4, height * 0.08, -halfW - 12, height * 0.08);
    graphics.lineBetween(halfW + 4, height * 0.08, halfW + 12, height * 0.08);
  }

  flashCoffin() {
    if (!this.coffinGlow || !this.coffinContainer) {
      return;
    }

    if (this.coffinGlowTween) {
      this.coffinGlowTween.stop();
    }

    this.coffinGlow.setAlpha(0.62);
    this.coffinContainer.setScale(1.08);
    this.coffinGlowTween = this.scene.tweens.add({
      targets: [this.coffinGlow],
      alpha: { from: 0.62, to: 0.08 },
      scaleX: { from: 1.2, to: 1 },
      scaleY: { from: 1.2, to: 1 },
      duration: 820,
      ease: 'Sine.easeOut',
      onComplete: () => {
        this.coffinContainer.setScale(1);
        this.coffinGlowTween = null;
      },
    });
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
    this.flashCoffin();
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

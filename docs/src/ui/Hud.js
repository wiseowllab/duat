import { CELL_SIZE } from '../data/constants.js';
import { getCoffinAsset } from '../data/coffins.js';
import { getPieceAsset, PIECE_COLORS, PIECE_LABELS } from '../data/pieces.js';
import { COFFIN_METER } from '../data/balance.js';

const HUD_WIDTH = 346;
const PANEL_FILL = 0x17100a;
const PANEL_STROKE = 0xd4af37;
const PANEL_STONE = 0x2a1c10;
const COFFIN_MAX_DISPLAY_WIDTH = 164;
const COFFIN_MAX_DISPLAY_HEIGHT = 146;
const COFFIN_BACKPLATE_WIDTH = 190;
const COFFIN_BACKPLATE_HEIGHT = 146;
const COFFIN_BAR_WIDTH = 282;
const COFFIN_BAR_HEIGHT = 18;
const COFFIN_BAR_INSET = 3;
const COFFIN_BAR_INNER_WIDTH = COFFIN_BAR_WIDTH - COFFIN_BAR_INSET * 2;
const COFFIN_BAR_FILL_HEIGHT = COFFIN_BAR_HEIGHT - COFFIN_BAR_INSET * 2;

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
    this.coffinBarPulseTween = null;
    this.currentCoffinSize = null;
    this.previousCoffinMeterValue = null;
    this.previousCoffinGodId = null;

    this.create();
  }

  create() {
    this.createPanels();

    this.scene.add.text(this.x + 18, this.y + 12, 'DUAT', {
      fontFamily: 'Georgia, serif',
      fontSize: '30px',
      color: '#d4af37',
      fontStyle: 'bold',
      letterSpacing: 2,
    });

    this.debugText = this.scene.add.text(this.x + 248, this.y + 16, 'DEBUG ON', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '10px',
      color: '#ffdf6e',
      fontStyle: 'bold',
      backgroundColor: '#3a1f00',
      padding: { x: 3, y: 2 },
    }).setVisible(false);

    this.scene.add.text(this.x + 18, this.y + 62, 'SCORE', this.headingStyle(15));
    this.scoreText = this.createLabel(18, 90, 'Score: 0', 18);
    this.chainText = this.createLabel(18, 116, 'Chain: 0', 15);
    this.bestScoreText = this.createLabel(18, 139, 'Best: 0', 13);
    this.levelText = this.createLabel(18, 158, 'Level: 1', 12);
    this.soundText = this.createLabel(96, 158, 'Sound: ON', 11);
    this.soundText.setColor('#9fdfe8');

    this.scene.add.text(this.x + 196, this.y + 62, 'NEXT', this.headingStyle(15));

    this.scene.add.text(this.x + 18, this.y + 198, 'CURRENT COFFIN', this.headingStyle(17));
    this.tierText = this.createLabel(22, 225, 'Tier 1 — Small Coffin', 14);
    this.godText = this.createLabel(22, 249, 'God: Imsety', 14);
    this.drawCoffinVisual({ tier: 1, tierName: 'Small Coffin', coffinSize: 'small' });
    this.coffinText = this.createLabel(22, 412, `Meter: 0 / ${COFFIN_METER.requiredByTier[1]}`, 13);
    this.coffinBarBack = this.scene.add.rectangle(this.x + 22, this.y + 436, COFFIN_BAR_WIDTH, COFFIN_BAR_HEIGHT, 0x0b0906, 0.94)
      .setOrigin(0, 0.5)
      .setStrokeStyle(2, 0xd4af37, 0.72);
    this.coffinBarFill = this.scene.add.rectangle(
      this.x + 22 + COFFIN_BAR_INSET,
      this.y + 436,
      COFFIN_BAR_INNER_WIDTH,
      COFFIN_BAR_FILL_HEIGHT,
      0xffd84d,
      0.96,
    ).setOrigin(0, 0.5);
    this.coffinBarHighlight = this.scene.add.rectangle(
      this.x + 22 + COFFIN_BAR_INSET,
      this.y + 432,
      COFFIN_BAR_INNER_WIDTH,
      2,
      0xffffb8,
      0.58,
    ).setOrigin(0, 0.5);
    this.updateCoffinBar(0);
    this.unlockedText = this.createLabel(22, 451, 'Unlocked: 0 / 14', 12);

    this.scene.add.text(this.x + 18, this.y + 487, 'BOMB STOCK', this.headingStyle(14));
    this.bombStockText = this.createLabel(18, 509, '1: Empty\n2: Empty\n3: Empty\n4: Empty', 10, 0);
    this.selectedBombText = this.createLabel(174, 509, 'Selected: None', 10, 0);
    this.selectedBombText.setColor('#9fdfe8');

    this.feedbackText = this.createLabel(198, 196, '', 15);
    this.feedbackText.setColor('#f4d77a');
    this.feedbackText.setFontStyle('bold');
    this.feedbackText.setWordWrapWidth(130);

    this.statusText = this.createLabel(184, 30, '', 11);
    this.statusText.setColor('#eadfca');
  }

  createPanels() {
    this.scene.add.rectangle(this.x + HUD_WIDTH / 2, this.y + 300, HUD_WIDTH, 568, 0x100b06, 0.9)
      .setStrokeStyle(2, PANEL_STROKE, 0.58);

    this.createPanel(12, 52, 160, 126, '');
    this.createPanel(184, 52, 150, 126, '');
    this.createPanel(12, 190, 322, 280, '');
    this.createPanel(12, 476, 322, 92, '');

    this.drawEgyptianAccents();
  }

  createPanel(offsetX, offsetY, width, height) {
    const panel = this.scene.add.rectangle(this.x + offsetX, this.y + offsetY, width, height, PANEL_FILL, 0.84)
      .setOrigin(0, 0)
      .setStrokeStyle(1, PANEL_STROKE, 0.38);
    this.scene.add.rectangle(this.x + offsetX + 4, this.y + offsetY + 4, width - 8, height - 8, PANEL_STONE, 0.22)
      .setOrigin(0, 0)
      .setStrokeStyle(1, 0xf0d27a, 0.08);
    return panel;
  }

  drawEgyptianAccents() {
    const graphics = this.scene.add.graphics();
    graphics.lineStyle(1, 0xf0d27a, 0.38);
    [58, 196, 486].forEach((offsetY) => {
      graphics.lineBetween(this.x + 22, this.y + offsetY, this.x + 68, this.y + offsetY);
      graphics.lineBetween(this.x + 278, this.y + offsetY, this.x + 324, this.y + offsetY);
    });
    graphics.fillStyle(0xd4af37, 0.36);
    graphics.fillTriangle(this.x + 320, this.y + 24, this.x + 328, this.y + 38, this.x + 312, this.y + 38);
    graphics.fillTriangle(this.x + 26, this.y + 24, this.x + 34, this.y + 38, this.x + 18, this.y + 38);
  }

  headingStyle(fontSize) {
    return {
      fontFamily: 'Arial, sans-serif',
      fontSize: `${fontSize}px`,
      color: '#f3e2a0',
      fontStyle: 'bold',
    };
  }

  createLabel(offsetX, offsetY, text, fontSize = 18, lineSpacing = 8) {
    return this.scene.add.text(this.x + offsetX, this.y + offsetY, text, {
      fontFamily: 'Arial, sans-serif',
      fontSize: `${fontSize}px`,
      color: '#eadfca',
      lineSpacing,
    });
  }

  updateScore(score) {
    this.scoreText.setText(`Score: ${score}`);
  }

  updateChain(chainCount) {
    this.chainText.setText(`Chain: ${chainCount}`);
  }

  updateBestScore(highScore) {
    this.bestScoreText.setText(`Best: ${highScore}`);
  }

  updateLevel(level) {
    this.levelText.setText(`Level: ${level}`);
  }

  updateSoundStatus(isSoundOn) {
    this.soundText.setText(`Sound: ${isSoundOn ? 'ON' : 'OFF'}`);
    this.soundText.setColor(isSoundOn ? '#9fdfe8' : '#c2b39c');
  }

  setDebugMode(isEnabled) {
    this.debugText.setVisible(isEnabled);
  }


  updateBombStock(stock, selectedSlot = null) {
    const selectedBomb = Number.isInteger(selectedSlot) ? stock[selectedSlot] : null;
    const lines = [0, 1, 2, 3].map((index) => {
      const bomb = stock[index];
      const marker = index === selectedSlot ? '▶' : ' ';
      if (!bomb) {
        return `${marker}${index + 1}: Empty`;
      }

      return `${marker}${index + 1}: ${this.compactBombName(bomb)}`;
    });

    this.bombStockText.setText(lines.join('\n'));

    if (selectedBomb) {
      this.selectedBombText.setText(`Sel: ${selectedSlot + 1} ${this.compactBombName(selectedBomb)}\nDrop/Space use\nEsc cancel`);
      this.selectedBombText.setColor('#9ff8ff');
      return;
    }

    this.selectedBombText.setText('Sel: None\n1-4/B1-B4 preview');
    this.selectedBombText.setColor('#9fdfe8');
  }

  compactBombName(bomb) {
    const label = `${bomb.godName} / ${bomb.name}`;
    const maxLength = 18;
    return label.length > maxLength ? `${label.slice(0, maxLength - 1)}…` : label;
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
    this.pulseCoffinBarOnGain(currentGod, progress);
  }

  drawCoffinVisual(currentTier) {
    const nextCoffinSize = currentTier.coffinSize ?? 'small';

    if (this.coffinContainer && this.currentCoffinSize === nextCoffinSize) {
      return;
    }

    if (this.coffinGlowTween) {
      this.coffinGlowTween.stop();
      this.coffinGlowTween = null;
    }

    if (this.coffinContainer) {
      this.coffinContainer.destroy(true);
    }

    const asset = getCoffinAsset(nextCoffinSize);
    const centerX = this.x + HUD_WIDTH / 2;
    const centerY = this.y + 336;
    const container = this.scene.add.container(centerX, centerY);
    const glowSize = Math.max(COFFIN_MAX_DISPLAY_WIDTH, COFFIN_MAX_DISPLAY_HEIGHT) + 26;

    const backplate = this.scene.add.rectangle(0, 0, COFFIN_BACKPLATE_WIDTH, COFFIN_BACKPLATE_HEIGHT, 0x0b0906, 0.64)
      .setStrokeStyle(1, 0xd4af37, 0.24);
    this.coffinGlow = this.scene.add.ellipse(0, 0, glowSize, glowSize, 0xd4af37, 0.08)
      .setStrokeStyle(2, 0xf4d77a, 0.16);
    const coffin = this.createCoffinDisplay(asset, currentTier.tier);

    container.add([backplate, this.coffinGlow, coffin]);
    this.coffinContainer = container;
    this.currentCoffinSize = nextCoffinSize;
  }

  createCoffinDisplay(asset, tier) {
    if (!asset || !this.scene.textures.exists(asset.key)) {
      return this.createCoffinGraphic({
        width: asset?.fallbackWidth ?? 76,
        height: asset?.fallbackHeight ?? 120,
        tier,
      });
    }

    const source = this.scene.textures.get(asset.key).getSourceImage();
    const scale = Math.min(
      COFFIN_MAX_DISPLAY_WIDTH / source.width,
      COFFIN_MAX_DISPLAY_HEIGHT / source.height,
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
    this.coffinBarFill.setScale(clampedRatio, 1);
    this.coffinBarHighlight.setScale(clampedRatio, 1);
    this.coffinBarFill.setVisible(clampedRatio > 0);
    this.coffinBarHighlight.setVisible(clampedRatio > 0);
  }

  pulseCoffinBarOnGain(currentGod, progress) {
    const currentGodId = currentGod?.id ?? 'complete';
    const previousValue = this.previousCoffinMeterValue;
    const previousGodId = this.previousCoffinGodId;
    const gainedMeter = previousValue !== null
      && previousGodId === currentGodId
      && progress.value > previousValue;

    this.previousCoffinMeterValue = progress.value;
    this.previousCoffinGodId = currentGodId;

    if (!gainedMeter) {
      return;
    }

    this.pulseCoffinBar();
  }

  pulseCoffinBar() {
    if (this.coffinBarPulseTween) {
      this.coffinBarPulseTween.stop();
    }

    this.coffinBarFill.setScale(this.coffinBarFill.scaleX, 1);
    this.coffinBarHighlight.setScale(this.coffinBarHighlight.scaleX, 1);
    this.coffinBarFill.setFillStyle(0xffff66, 1);
    this.coffinBarHighlight.setAlpha(0.95);
    this.coffinBarBack.setStrokeStyle(2, 0xffec8b, 0.96);

    this.coffinBarPulseTween = this.scene.tweens.add({
      targets: [this.coffinBarFill, this.coffinBarHighlight],
      alpha: { from: 1, to: 0.86 },
      scaleY: { from: 1.28, to: 1 },
      duration: 260,
      yoyo: true,
      ease: 'Sine.easeOut',
      onComplete: () => {
        this.coffinBarFill.setScale(this.coffinBarFill.scaleX, 1);
        this.coffinBarHighlight.setScale(this.coffinBarHighlight.scaleX, 1);
        this.coffinBarFill.setFillStyle(0xffd84d, 0.96);
        this.coffinBarFill.setAlpha(0.96);
        this.coffinBarHighlight.setAlpha(0.58);
        this.coffinBarBack.setStrokeStyle(2, 0xd4af37, 0.72);
        this.coffinBarPulseTween = null;
      },
    });
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

  showBombUsed(bomb, affectedCount) {
    if (bomb.type === 'maximum_coffin_burst') {
      this.showFeedback(`AMUN-RA AWAKENED!\nDUAT COMPLETE!\n${affectedCount} affected`, 2200);
      return;
    }

    this.showFeedback(`BOMB! ${bomb.name}\n${affectedCount} affected`, 1200);
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

  clearFeedback() {
    this.feedbackText.setText('');

    if (this.feedbackTimer) {
      this.feedbackTimer.remove(false);
      this.feedbackTimer = null;
    }
  }

  showReadyStatus() {
    this.statusText.setText('');
    this.statusText.setColor('#eadfca');
  }

  showGameOver() {
    this.statusText.setText('Game Over — Enter/Space Restart');
    this.statusText.setColor('#ff7b7b');
  }

  drawNext(types) {
    this.clearNext();

    const startX = this.x + 220;
    const startY = this.y + 112;

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

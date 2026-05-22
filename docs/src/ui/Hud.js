import { getCoffinAsset } from '../data/coffins.js';
import { getPieceAsset, PIECE_COLORS, PIECE_LABELS } from '../data/pieces.js';
import { COFFIN_METER } from '../data/balance.js';
import { GAME_VERSION, BUILD_LABEL, COMMIT_SHA } from '../data/buildInfo.js';

const HUD_WIDTH = 166;
const HUD_INNER_MARGIN = 8;
const PANEL_FILL = 0x17100a;
const PANEL_STROKE = 0xd4af37;
const PANEL_STONE = 0x2a1c10;
const COFFIN_PANEL_X = 8;
const COFFIN_PANEL_Y = 200;
const COFFIN_PANEL_WIDTH = 150;
const COFFIN_PANEL_HEIGHT = 176;
const COFFIN_PANEL_MARGIN = 8;
const COFFIN_IMAGE_AREA_WIDTH = COFFIN_PANEL_WIDTH - COFFIN_PANEL_MARGIN * 2;
const COFFIN_IMAGE_AREA_HEIGHT = COFFIN_PANEL_HEIGHT - COFFIN_PANEL_MARGIN * 2;
const COFFIN_BAR_WIDTH = COFFIN_IMAGE_AREA_WIDTH - 18;
const COFFIN_BAR_HEIGHT = 18;
const COFFIN_BAR_INSET = 3;
const COFFIN_BAR_INNER_WIDTH = COFFIN_BAR_WIDTH - COFFIN_BAR_INSET * 2;
const COFFIN_BAR_FILL_HEIGHT = COFFIN_BAR_HEIGHT - COFFIN_BAR_INSET * 2;
const HUD_LAYER_BASE = 10;
const HUD_LAYER_COFFIN = 12;
const HUD_LAYER_COFFIN_BACKPLATE = 12.5;
const HUD_LAYER_COFFIN_OVERLAY_TEXT = 13;
const HUD_LAYER_COFFIN_METER = 13.5;
const HUD_LAYER_COFFIN_BAR_BG = 13.6;
const HUD_LAYER_COFFIN_BAR_FILL = 13.7;
const HUD_LAYER_TEXT = 13;
const HUD_LAYER_UNLOCK_FEEDBACK = 14;
const HUD_LAYER_UNLOCK_BADGE = 17;
const REVIVED_ICON_VISIBLE_MAX = 8;
const NEXT_ICON_SIZE = 22;
const HUD_TOP_HEIGHT = 90;
const HUD_NEXT_HEIGHT = 90;
const HUD_COFFIN_HEIGHT = 176;
const HUD_BOMB_HEIGHT = 98;
const HUD_REVIVED_HEIGHT = 76;
const HUD_SECTION_GAP = 8;
const HUD_PANEL_INSET = 6;
const HUD_STACK_START_Y = 40;

const COFFIN_TIER_LABELS = {
  1: '小さな棺',
  2: '中くらいの棺',
  3: '大きな棺',
  4: '最大の棺',
};

const BOMB_LABELS_JA = {
  vertical_clear: '縦消し',
  horizontal_clear: '横消し',
  cross_clear: '十字消し',
  surround_clear: '周囲消し',
  brain_clear: '脳消去',
  knowledge_convert: '変換',
  protective_clear: '守護消し',
  war_burst: '戦火',
  triple_column_clear: '三列消し',
  piece_transform: '変換',
  half_board_reset: '半面リセット',
  chaos_clear: '混沌消し',
  full_board_clear: '全消し',
  maximum_coffin_burst: '最大棺バースト',
};

export class Hud {
  constructor(scene, x, y, width = HUD_WIDTH) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.width = Math.max(120, width);
    this.panelWidth = this.width - HUD_INNER_MARGIN * 2;
    this.panelCenterX = this.x + HUD_INNER_MARGIN + this.panelWidth / 2;
    this.nextBlocks = [];
    this.feedbackTimer = null;
    this.coffinContainer = null;
    this.coffinGlow = null;
    this.coffinGlowTween = null;
    this.coffinBarPulseTween = null;
    this.coffinPanelFlashTween = null;
    this.currentCoffinSize = null;
    this.feedbackFadeTween = null;
    this.unlockBadgeContainer = null;
    this.unlockBadgeFadeTween = null;
    this.unlockBadgeTimer = null;
    this.previousCoffinMeterValue = null;
    this.previousCoffinGodId = null;
    this.revivedCount = 0;
    this.revivedIcons = [];

    this.create();
  }

  create() {
    this.createPanels();

    this.scene.add.text(this.x + 10, this.y + 8, 'DUAT', {
      fontFamily: 'Georgia, serif',
      fontSize: '24px',
      color: '#d4af37',
      fontStyle: 'bold',
      letterSpacing: 2,
    }).setDepth(HUD_LAYER_TEXT);

    this.debugText = this.scene.add.text(this.x + 100, this.y + 12, 'DBG', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '10px',
      color: '#ffdf6e',
      fontStyle: 'bold',
      backgroundColor: '#3a1f00',
      padding: { x: 3, y: 2 },
    }).setDepth(HUD_LAYER_TEXT).setVisible(false);

    const scoreSectionY = this.y + HUD_STACK_START_Y;
    const nextSectionY = scoreSectionY + HUD_TOP_HEIGHT + HUD_SECTION_GAP;
    const coffinSectionY = nextSectionY + HUD_NEXT_HEIGHT + HUD_SECTION_GAP;
    const bombSectionY = coffinSectionY + HUD_COFFIN_HEIGHT + HUD_SECTION_GAP;
    const revivedSectionY = bombSectionY + HUD_BOMB_HEIGHT + HUD_SECTION_GAP;

    this.scene.add.text(this.x + 12, scoreSectionY + 6, 'SCORE', this.headingStyle(11)).setDepth(HUD_LAYER_TEXT);
    this.scoreText = this.createLabel(12, scoreSectionY + 25 - this.y, 'Score: 0', 11, 1);
    this.chainText = this.createLabel(12, scoreSectionY + 41 - this.y, 'Chain: 0', 10, 1);
    this.bestScoreText = this.createLabel(12, scoreSectionY + 56 - this.y, 'Best: 0', 9, 1);
    this.levelText = this.createLabel(12, scoreSectionY + 70 - this.y, 'Lv: 1', 9, 1);
    this.soundText = this.createLabel(12, scoreSectionY + 84 - this.y, 'SND: ON', 9, 1);
    this.soundText.setColor('#9fdfe8');

    this.scene.add.text(this.x + 12, nextSectionY + 6, 'NEXT', this.headingStyle(11)).setDepth(HUD_LAYER_TEXT);

    this.scene.add.text(this.x + 12, coffinSectionY + 6, 'CURRENT COFFIN', this.headingStyle(10))
      .setDepth(HUD_LAYER_TEXT)
      .setStroke('#120d06', 4)
      .setShadow(0, 1, '#000000', 2, true, true);
    this.coffinTopTextBackplate = this.scene.add.rectangle(this.panelCenterX, coffinSectionY + 31, this.panelWidth - 14, 30, 0x060402, 0.56)
      .setStrokeStyle(1, 0xd4af37, 0.22)
      .setDepth(HUD_LAYER_COFFIN_BACKPLATE);
    this.tierText = this.createLabel(14, coffinSectionY + 19 - this.y, 'Tier 1', 9, 1);
    this.godText = this.createLabel(14, coffinSectionY + 31 - this.y, 'God: Imsety', 8, 1);
    this.tierText.setDepth(HUD_LAYER_COFFIN_OVERLAY_TEXT);
    this.godText.setDepth(HUD_LAYER_COFFIN_OVERLAY_TEXT);
    this.tierText.setStroke('#120d06', 4).setShadow(0, 1, '#000000', 2, true, true);
    this.godText.setStroke('#120d06', 4).setShadow(0, 1, '#000000', 2, true, true);
    this.drawCoffinVisual({ tier: 1, tierName: 'Small Coffin', coffinSize: 'small' });
    this.coffinBottomTextBackplate = this.scene.add.rectangle(this.panelCenterX, coffinSectionY + 141, this.panelWidth - 10, 42, 0x060402, 0.62)
      .setStrokeStyle(1, 0xd4af37, 0.22)
      .setDepth(HUD_LAYER_COFFIN_BACKPLATE);
    this.coffinText = this.createLabel(14, coffinSectionY + 145 - this.y, `Meter: 0 / ${COFFIN_METER.requiredByTier[1]}`, 8, 1);
    this.coffinText.setDepth(HUD_LAYER_COFFIN_METER);
    this.coffinText.setStroke('#120d06', 3).setShadow(0, 1, '#000000', 2, true, true);
    this.coffinBarBack = this.scene.add.rectangle(this.x + 14, coffinSectionY + 131, COFFIN_BAR_WIDTH, COFFIN_BAR_HEIGHT, 0x0b0906, 0.94)
      .setOrigin(0, 0.5)
      .setStrokeStyle(2, 0xd4af37, 0.72)
      .setDepth(HUD_LAYER_COFFIN_BAR_BG);
    this.coffinBarFill = this.scene.add.rectangle(
      this.x + 22 + COFFIN_BAR_INSET,
      coffinSectionY + 131,
      COFFIN_BAR_INNER_WIDTH,
      COFFIN_BAR_FILL_HEIGHT,
      0xffd84d,
      0.96,
    ).setOrigin(0, 0.5).setDepth(HUD_LAYER_COFFIN_BAR_FILL);
    this.coffinBarHighlight = this.scene.add.rectangle(
      this.x + 22 + COFFIN_BAR_INSET,
      coffinSectionY + 127,
      COFFIN_BAR_INNER_WIDTH,
      2,
      0xffffb8,
      0.58,
    ).setOrigin(0, 0.5).setDepth(HUD_LAYER_COFFIN_BAR_FILL);
    this.updateCoffinBar(0);
    this.unlockedText = this.createLabel(14, coffinSectionY + 157 - this.y, 'Awake: 0 / 14', 8, 1);
    this.unlockedText.setDepth(HUD_LAYER_COFFIN_METER);
    this.unlockedText.setStroke('#120d06', 3).setShadow(0, 1, '#000000', 2, true, true);

    this.scene.add.text(this.x + 12, bombSectionY + 6, 'BOMB STOCK', this.headingStyle(10)).setDepth(HUD_LAYER_TEXT);
    this.bombStockText = this.createLabel(12, bombSectionY + 24 - this.y, '1: 空\n2: 空\n3: 空\n4: 空', 8, 0);
    this.selectedBombText = this.createLabel(12, bombSectionY + 76 - this.y, '選択: なし', 8, 0);
    this.selectedBombText.setColor('#9fdfe8');

    this.feedbackContainer = this.scene.add.container(this.panelCenterX + 8, coffinSectionY + 86)
      .setDepth(HUD_LAYER_UNLOCK_FEEDBACK);
    this.feedbackBackdrop = this.scene.add.rectangle(0, 0, 122, 74, 0x050402, 0.72)
      .setStrokeStyle(1, 0xd4af37, 0.44)
      .setVisible(false);
    this.feedbackText = this.scene.add.text(-52, -27, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      color: '#f4d77a',
      fontStyle: 'bold',
      lineSpacing: 6,
      wordWrap: { width: 104 },
    }).setAlpha(1);
    this.feedbackContainer.add([this.feedbackBackdrop, this.feedbackText]);

    this.createUnlockBadge();

    this.statusText = this.createLabel(90, 28, '', 8);
    this.statusText.setColor('#eadfca');
    this.buildText = this.createLabel(10, 628, `v${GAME_VERSION} / ${COMMIT_SHA}`, 6, 0);
    this.buildText.setColor('#bcae90');
    this.createRevivedSoulsHud();
  }

  createRevivedSoulsHud() {
    const panelX = this.x + 8;
    const panelY = this.y + HUD_STACK_START_Y + HUD_TOP_HEIGHT + HUD_SECTION_GAP + HUD_NEXT_HEIGHT + HUD_SECTION_GAP + HUD_COFFIN_HEIGHT + HUD_SECTION_GAP + HUD_BOMB_HEIGHT + HUD_SECTION_GAP;
    this.revivedPanel = this.scene.add.container(panelX, panelY).setDepth(HUD_LAYER_TEXT);
    const panelBack = this.scene.add.rectangle(0, 0, this.panelWidth, HUD_REVIVED_HEIGHT, 0x0d0a06, 0.92)
      .setStrokeStyle(1, 0xd4af37, 0.45)
      .setOrigin(0, 0);
    this.revivedLabelText = this.scene.add.text(8, 6, 'REVIVED SOULS', {
      fontFamily: 'Noto Sans JP, Arial, sans-serif',
      fontSize: '9px',
      color: '#f4d77a',
      fontStyle: 'bold',
    });
    this.revivedCountText = this.scene.add.text(this.panelWidth - 32, 6, '×0', {
      fontFamily: 'Georgia, serif',
      fontSize: '10px',
      color: '#e5d0a0',
      fontStyle: 'bold',
    });
    this.revivedIconsContainer = this.scene.add.container(10, 24);
    this.revivedPanel.add([panelBack, this.revivedLabelText, this.revivedCountText, this.revivedIconsContainer]);
  }

  updateRevivedSouls(count) {
    this.revivedCount = Math.max(0, count);
    this.revivedCountText.setText(`×${this.revivedCount}`);
    this.renderRevivedIcons();
  }

  renderRevivedIcons() {
    this.revivedIcons.forEach((icon) => icon.destroy());
    this.revivedIcons = [];
    this.revivedIconsContainer.removeAll(true);

    const visibleCount = Math.min(this.revivedCount, REVIVED_ICON_VISIBLE_MAX);
    for (let index = 0; index < visibleCount; index += 1) {
      const col = index % 4;
      const row = Math.floor(index / 4);
      const iconX = col * 30;
      const iconY = row * 18;
      const icon = this.scene.add.text(iconX, iconY, '𓀾', {
        fontFamily: 'Georgia, serif',
        fontSize: '13px',
        color: '#d9bb76',
      }).setShadow(0, 0, '#f0c14f', 4, true, true);
      this.revivedIcons.push(icon);
      this.revivedIconsContainer.add(icon);
    }
  }

  createUnlockBadge() {
    const badgeX = this.panelCenterX + 8;
    const badgeY = this.y + 254;
    this.unlockBadgeContainer = this.scene.add.container(badgeX, badgeY)
      .setDepth(HUD_LAYER_UNLOCK_BADGE)
      .setVisible(false)
      .setAlpha(0);
    const badgeBackground = this.scene.add.rectangle(0, 0, 122, 68, 0x040302, 0.82)
      .setOrigin(0.5)
      .setStrokeStyle(1, 0xd4af37, 0.9);
    const badgeText = this.scene.add.text(-53, -26, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      color: '#f4d77a',
      fontStyle: 'bold',
      lineSpacing: 5,
      wordWrap: { width: 106 },
    });
    this.unlockBadgeText = badgeText;
    this.unlockBadgeContainer.add([badgeBackground, badgeText]);
  }

  createPanels() {
    const panelAreaHeight = HUD_TOP_HEIGHT + HUD_NEXT_HEIGHT + HUD_COFFIN_HEIGHT + HUD_BOMB_HEIGHT + HUD_REVIVED_HEIGHT + (HUD_SECTION_GAP * 4) + (HUD_PANEL_INSET * 2);
    this.scene.add.rectangle(this.x + this.width / 2, this.y + 40 + (panelAreaHeight / 2), this.width, panelAreaHeight, 0x100b06, 0.9)
      .setStrokeStyle(2, PANEL_STROKE, 0.58)
      .setDepth(HUD_LAYER_BASE);

    this.createPanel(8, HUD_STACK_START_Y, this.panelWidth, HUD_TOP_HEIGHT, '');
    this.createPanel(8, HUD_STACK_START_Y + HUD_TOP_HEIGHT + HUD_SECTION_GAP, this.panelWidth, HUD_NEXT_HEIGHT, '');
    this.coffinPanel = this.createPanel(COFFIN_PANEL_X, COFFIN_PANEL_Y, this.panelWidth, COFFIN_PANEL_HEIGHT, '');
    this.createPanel(8, HUD_STACK_START_Y + HUD_TOP_HEIGHT + HUD_SECTION_GAP + HUD_NEXT_HEIGHT + HUD_SECTION_GAP + HUD_COFFIN_HEIGHT, this.panelWidth, HUD_BOMB_HEIGHT, '');
    this.createPanel(8, HUD_STACK_START_Y + HUD_TOP_HEIGHT + HUD_SECTION_GAP + HUD_NEXT_HEIGHT + HUD_SECTION_GAP + HUD_COFFIN_HEIGHT + HUD_SECTION_GAP + HUD_BOMB_HEIGHT, this.panelWidth, HUD_REVIVED_HEIGHT, '');

    this.drawEgyptianAccents();
  }

  createPanel(offsetX, offsetY, width, height) {
    const panel = this.scene.add.rectangle(this.x + offsetX, this.y + offsetY, width, height, PANEL_FILL, 0.84)
      .setOrigin(0, 0)
      .setStrokeStyle(1, PANEL_STROKE, 0.38)
      .setDepth(HUD_LAYER_BASE + 1);
    this.scene.add.rectangle(this.x + offsetX + 4, this.y + offsetY + 4, width - 8, height - 8, PANEL_STONE, 0.22)
      .setOrigin(0, 0)
      .setStrokeStyle(1, 0xf0d27a, 0.08)
      .setDepth(HUD_LAYER_BASE + 1);
    return panel;
  }

  drawEgyptianAccents() {
    const graphics = this.scene.add.graphics();
    graphics.lineStyle(1, 0xf0d27a, 0.38);
    [52, 160, 382, 504].forEach((offsetY) => {
      graphics.lineBetween(this.x + 22, this.y + offsetY, this.x + 68, this.y + offsetY);
      graphics.lineBetween(this.x + this.panelWidth - 26, this.y + offsetY, this.x + this.panelWidth + 20, this.y + offsetY);
    });
    graphics.fillStyle(0xd4af37, 0.36);
    graphics.fillTriangle(this.x + this.panelWidth - 16, this.y + 24, this.x + this.panelWidth - 8, this.y + 38, this.x + this.panelWidth - 24, this.y + 38);
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
    }).setDepth(HUD_LAYER_TEXT);
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
    this.levelText.setText(`Lv: ${level}`);
  }

  updateSoundStatus(isSoundOn) {
    this.soundText.setText(`SND: ${isSoundOn ? 'ON' : 'OFF'}`);
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
        return `${marker}${index + 1}: 空`;
      }

      return `${marker}${index + 1}: ${this.compactBombName(bomb)}`;
    });

    this.bombStockText.setText(lines.join('\n'));

    if (selectedBomb) {
      this.selectedBombText.setText(`選択: ${selectedSlot + 1} ${this.compactBombName(selectedBomb)}\nDROP/Space: 発動\nEsc: 取消`);
      this.selectedBombText.setColor('#9ff8ff');
      return;
    }

    this.selectedBombText.setText('選択: なし\n1〜4/B1〜B4');
    this.selectedBombText.setColor('#9fdfe8');
  }

  compactBombName(bomb) {
    const label = `${bomb.godName} / ${this.getBombLabel(bomb)}`;
    const maxLength = 18;
    return label.length > maxLength ? `${label.slice(0, maxLength - 1)}…` : label;
  }

  getBombLabel(bomb) {
    return BOMB_LABELS_JA[bomb.type] ?? bomb.name;
  }

  getCoffinTierLabel(currentTier) {
    return COFFIN_TIER_LABELS[currentTier.tier] ?? currentTier.tierName;
  }

  updateCoffin(state) {
    const { currentGod, currentTier, progress, unlockedCount, totalGods, isComplete } = state;

    if (isComplete) {
      this.tierText.setText('棺 4 — DUAT COMPLETE');
      this.godText.setText('神: すべて覚醒');
      this.coffinText.setText('Meter: 完了');
      this.drawCoffinVisual(currentTier);
    } else {
      this.tierText.setText(`Tier ${currentTier.tier} / ${this.getCoffinTierLabel(currentTier)}`);
      this.godText.setText(`God: ${currentGod.name}`);
      this.coffinText.setText(`Meter: ${progress.value} / ${progress.required}`);
      this.drawCoffinVisual(currentTier);
    }

    this.unlockedText.setText(`Awake: ${unlockedCount} / ${totalGods}`);
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
    const centerX = this.x + COFFIN_PANEL_X + (COFFIN_PANEL_WIDTH / 2);
    const centerY = this.y + COFFIN_PANEL_Y + (COFFIN_PANEL_HEIGHT / 2) + 6;
    const container = this.scene.add.container(centerX, centerY).setDepth(HUD_LAYER_COFFIN);
    const glowSize = Math.max(COFFIN_IMAGE_AREA_WIDTH, COFFIN_IMAGE_AREA_HEIGHT) + 18;

    const backplate = this.scene.add.rectangle(0, 0, COFFIN_IMAGE_AREA_WIDTH, COFFIN_IMAGE_AREA_HEIGHT, 0x0b0906, 0.38)
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
      COFFIN_IMAGE_AREA_WIDTH / source.width,
      COFFIN_IMAGE_AREA_HEIGHT / source.height,
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

  flashCoffin(intensityTier = 1) {
    if (!this.coffinGlow || !this.coffinContainer) {
      return;
    }

    if (this.coffinGlowTween) {
      this.coffinGlowTween.stop();
    }

    const tier = Phaser.Math.Clamp(intensityTier, 1, 4);
    const glowStart = 0.52 + tier * 0.08;
    const scaleStart = 1.05 + tier * 0.015;
    const duration = Math.max(520, 860 - tier * 50);

    this.coffinGlow.setAlpha(glowStart);
    this.coffinContainer.setScale(scaleStart);
    this.coffinGlowTween = this.scene.tweens.add({
      targets: [this.coffinGlow],
      alpha: { from: glowStart, to: 0.08 },
      scaleX: { from: 1.14 + tier * 0.04, to: 1 },
      scaleY: { from: 1.14 + tier * 0.04, to: 1 },
      duration,
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
      messages.push('クリア!');
    }

    if (clearedCanopicSet) {
      messages.push('カノプスセット!');
    }

    if (chainCount >= 2) {
      messages.push(`${chainCount}連鎖`);
    }

    this.showFeedback(messages.join('\n'), 1400);
  }

  showBombUsed(bomb, affectedCount) {
    if (bomb.type === 'maximum_coffin_burst') {
      this.showFeedback(`AMUN-RA 覚醒!\nDUAT COMPLETE!\n${affectedCount}個に影響`, 2200);
      return;
    }

    this.showFeedback(`ボム! ${this.getBombLabel(bomb)}\n${affectedCount}個に影響`, 1200);
  }

  showGodUnlocked(unlockEvents) {
    const latestUnlock = unlockEvents[unlockEvents.length - 1];
    const god = latestUnlock.god;
    const tier = god?.tier ?? 1;
    const bombName = this.getUnlockGrantedBombLabel(latestUnlock);
    const badgeMessage = `神、目覚める\n${god?.name}\n授与ボム: ${bombName}`;

    this.flashCoffin(tier);
    this.flashCoffinPanel(tier);
    this.showUnlockBadge(badgeMessage, 1900);
  }

  getUnlockGrantedBombLabel(unlockEvent) {
    const grantedBombType = unlockEvent?.grantedBomb?.type;
    if (grantedBombType) {
      return BOMB_LABELS_JA[grantedBombType] ?? grantedBombType;
    }

    if (unlockEvent?.grantStatus === 'stock_full') {
      return 'ストック満杯';
    }

    if (unlockEvent?.grantStatus === 'unsupported') {
      return '未対応';
    }

    return 'なし';
  }

  showUnlockBadge(message, durationMs) {
    if (!this.unlockBadgeContainer || !this.unlockBadgeText) {
      return;
    }

    this.unlockBadgeText.setText(message);
    this.unlockBadgeContainer.setVisible(Boolean(message));
    this.unlockBadgeContainer.setAlpha(1);

    if (this.unlockBadgeFadeTween) {
      this.unlockBadgeFadeTween.stop();
      this.unlockBadgeFadeTween = null;
    }

    if (this.unlockBadgeTimer) {
      this.unlockBadgeTimer.remove(false);
      this.unlockBadgeTimer = null;
    }

    this.unlockBadgeTimer = this.scene.time.delayedCall(durationMs, () => {
      this.unlockBadgeFadeTween = this.scene.tweens.add({
        targets: this.unlockBadgeContainer,
        alpha: 0,
        duration: 220,
        ease: 'Sine.easeOut',
        onComplete: () => {
          this.unlockBadgeContainer.setVisible(false);
          this.unlockBadgeContainer.setAlpha(0);
          this.unlockBadgeText.setText('');
          this.unlockBadgeFadeTween = null;
        },
      });
      this.unlockBadgeTimer = null;
    });
  }

  flashCoffinPanel(tier) {
    if (!this.coffinPanel) {
      return;
    }

    if (this.coffinPanelFlashTween) {
      this.coffinPanelFlashTween.stop();
      this.coffinPanelFlashTween = null;
    }

    const clampedIndex = Math.max(0, Math.min(3, tier - 1));
    const strokeAlphaByTier = [0.55, 0.72, 0.84, 0.96];
    const strokeAlpha = strokeAlphaByTier[clampedIndex];
    const strokeColor = tier >= 4 ? 0xffef9a : 0xf6d77a;
    this.coffinPanel.setStrokeStyle(2, strokeColor, strokeAlpha);

    this.coffinPanelFlashTween = this.scene.tweens.addCounter({
      from: 0,
      to: 1,
      yoyo: true,
      repeat: 2 + clampedIndex,
      duration: 120,
      onUpdate: (tween) => {
        const progress = tween.getValue();
        const pulseAlpha = strokeAlpha + (1 - strokeAlpha) * progress;
        this.coffinPanel.setStrokeStyle(2, strokeColor, pulseAlpha);
      },
      onComplete: () => {
        this.coffinPanel.setStrokeStyle(1, PANEL_STROKE, 0.38);
        this.coffinPanelFlashTween = null;
      },
    });
  }

  showFeedback(message, durationMs) {
    this.feedbackText.setText(message);
    this.feedbackText.setAlpha(1);
    this.feedbackBackdrop.setVisible(Boolean(message));
    this.feedbackBackdrop.setAlpha(0.66);

    if (this.feedbackFadeTween) {
      this.feedbackFadeTween.stop();
      this.feedbackFadeTween = null;
    }

    if (this.feedbackTimer) {
      this.feedbackTimer.remove(false);
    }

    this.feedbackTimer = this.scene.time.delayedCall(durationMs, () => {
      this.feedbackFadeTween = this.scene.tweens.add({
        targets: [this.feedbackText, this.feedbackBackdrop],
        alpha: 0,
        duration: 230,
        ease: 'Sine.easeOut',
        onComplete: () => {
          this.feedbackText.setText('');
          this.feedbackText.setAlpha(1);
          this.feedbackBackdrop.setVisible(false);
          this.feedbackBackdrop.setAlpha(0.66);
          this.feedbackFadeTween = null;
        },
      });
    });
  }

  clearFeedback() {
    this.feedbackText.setText('');
    this.feedbackText.setAlpha(1);
    this.feedbackBackdrop.setVisible(false);
    this.feedbackBackdrop.setAlpha(0.66);

    if (this.feedbackFadeTween) {
      this.feedbackFadeTween.stop();
      this.feedbackFadeTween = null;
    }

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
    this.statusText.setText('ゲームオーバー — Enter/Space でリスタート');
    this.statusText.setColor('#ff7b7b');
  }

  setGameOverAtmosphere(isGameOver) {
    const isDimmed = Boolean(isGameOver);

    if (this.coffinGlow) {
      this.coffinGlow.setAlpha(isDimmed ? 0.02 : 0.08);
    }

    if (this.coffinContainer) {
      this.coffinContainer.setScale(1);
      this.coffinContainer.setAlpha(isDimmed ? 0.84 : 1);
    }

    if (this.coffinPanel) {
      this.coffinPanel.setFillStyle(PANEL_FILL, isDimmed ? 0.68 : 0.84);
      this.coffinPanel.setStrokeStyle(1, PANEL_STROKE, isDimmed ? 0.24 : 0.38);
    }
  }

  drawNext(types) {
    this.clearNext();

    const startX = this.x + 18;
    const startY = this.y + 172;

    types.forEach((type, index) => {
      const y = startY + index * 24;
      const block = this.drawNextBlock(startX, y, type);
      const label = this.scene.add.text(startX + 24, y - 6, PIECE_LABELS[type], {
        fontFamily: 'Arial, sans-serif',
        fontSize: '9px',
        color: '#eadfca',
      }).setDepth(HUD_LAYER_TEXT);

      this.nextBlocks.push(block, label);
    });
  }

  drawNextBlock(x, y, type) {
    const asset = getPieceAsset(type);

    const container = this.scene.add.container(x, y).setDepth(HUD_LAYER_TEXT);
    const shadow = this.scene.add.ellipse(2, 3, NEXT_ICON_SIZE, NEXT_ICON_SIZE, 0x000000, 0.28);
    const fallbackBlock = this.scene.add.rectangle(0, 0, NEXT_ICON_SIZE, NEXT_ICON_SIZE, PIECE_COLORS[type], 0.32)
      .setStrokeStyle(1, 0xf6e3a1, 0.32);

    container.add([shadow, fallbackBlock]);

    if (asset && this.scene.textures.exists(asset.key)) {
      const image = this.scene.add.image(0, 0, asset.key)
        .setDisplaySize(NEXT_ICON_SIZE, NEXT_ICON_SIZE);
      container.add(image);
    }

    return container;
  }

  clearNext() {
    this.nextBlocks.forEach((item) => item.destroy());
    this.nextBlocks = [];
  }
}

import { COFFIN_ASSET_VARIANTS, getCoffinAssetForGod } from '../data/coffins.js';
import { getPieceAsset, PIECE_COLORS, PIECE_LABELS } from '../data/pieces.js';
import { COFFIN_METER } from '../data/balance.js';
import { GODS } from '../data/gods.js';
import { GAME_VERSION, BUILD_LABEL, COMMIT_SHA } from '../data/buildInfo.js';

const HUD_WIDTH = 166;
const HUD_INNER_MARGIN = 8;
const PANEL_FILL = 0x17100a;
const PANEL_STROKE = 0xd4af37;
const PANEL_STONE = 0x2a1c10;
const COFFIN_PANEL_X = 8;
const COFFIN_PANEL_HEIGHT = 232;
const COFFIN_PANEL_MARGIN = 12;
const COFFIN_IMAGE_AREA_HEIGHT = 164;
const COFFIN_BAR_HEIGHT = 20;
const COFFIN_BAR_INSET = 3;
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
const REVIVED_ICON_VISIBLE_MAX = 12;
const REVIVED_ICON_COLUMNS = 4;
const REVIVED_ICON_SPACING_X = 18;
const REVIVED_ICON_SPACING_Y = 11;
const REVIVED_ICON_BASE_FONT_SIZE = 11;
const NEXT_ICON_SIZE = 31;
const HUD_TOP_HEIGHT = 112;
const HUD_NEXT_HEIGHT = 96;
const HUD_COFFIN_HEIGHT = COFFIN_PANEL_HEIGHT;
const HUD_UNDERWORLD_HEIGHT = 64;
const HUD_SHRINE_HEIGHT = 84;
const HUD_REVIVED_HEIGHT = 62;
const HUD_SECTION_GAP = 7;
const HUD_PANEL_INSET = 8;
const HUD_STACK_START_Y = 40;
const HUD_TOWER_HEIGHT = HUD_TOP_HEIGHT + HUD_NEXT_HEIGHT + HUD_COFFIN_HEIGHT + HUD_UNDERWORLD_HEIGHT + HUD_SHRINE_HEIGHT + HUD_REVIVED_HEIGHT + (HUD_SECTION_GAP * 5);
const SECTION_X = 14;
const SECTION_HEADER_Y = 7;

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
const SHRINE_ICON_SIZE = 25;
const SHRINE_ICON_COLUMNS = 7;
const SHRINE_ICON_SPACING_X = 27;
const SHRINE_ICON_SPACING_Y = 28;
const SHRINE_USED_ALPHA = 0.5;

export class Hud {
  constructor(scene, x, y, width = HUD_WIDTH) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.width = Math.max(120, width);
    this.panelWidth = this.width - HUD_INNER_MARGIN * 2;
    this.panelCenterX = this.x + HUD_INNER_MARGIN + this.panelWidth / 2;
    this.coffinPanelWidth = this.panelWidth;
    this.coffinImageAreaWidth = this.coffinPanelWidth - COFFIN_PANEL_MARGIN * 2;
    this.coffinBarWidth = this.coffinImageAreaWidth - 18;
    this.coffinBarInnerWidth = this.coffinBarWidth - COFFIN_BAR_INSET * 2;
    this.nextBlocks = [];
    this.feedbackTimer = null;
    this.coffinContainer = null;
    this.coffinGlow = null;
    this.coffinGlowTween = null;
    this.coffinBarPulseTween = null;
    this.coffinPanelFlashTween = null;
    this.pureCanopicCoffinTween = null;
    this.pureCanopicTextTween = null;
    this.pureCanopicTextTimer = null;
    this.currentCoffinVisualId = null;
    this.currentCoffinTier = null;
    this.currentCoffinGod = null;
    this.isDebugMode = false;
    this.feedbackFadeTween = null;
    this.unlockBadgeContainer = null;
    this.unlockBadgeFadeTween = null;
    this.unlockBadgeTimer = null;
    this.previousCoffinMeterValue = null;
    this.previousCoffinGodId = null;
    this.revivedCount = 0;
    this.revivedIcons = [];
    this.revivedIconTweens = [];
    this.scene.events?.on('coffin-assets-ready', this.refreshCoffinVisual, this);
    this.scene.events?.on('coffin-assets-ready', this.renderShrine, this);
    this.scene.events?.on('coffin-assets-ready', this.refreshBombButtonAssets, this);
    this.revivedEyeTimers = [];
    this.revivedDepthLevel = 1;
    this.depthAtmosphereTween = null;
    this.shrineIcons = [];
    this.shrinePulseTweens = [];
    this.lastUnlockedGodsForShrine = [];
    this.lastBombStockForShrine = [];
    this.lastSelectedBombSlotForShrine = null;
    this.lastUsedGodIdsForShrine = new Set();

    this.create();
  }

  create() {
    this.sectionLayout = this.buildSectionLayout();
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

    const scoreSectionY = this.y + this.sectionLayout.score.y;
    const nextSectionY = this.y + this.sectionLayout.next.y;
    const coffinSectionY = this.y + this.sectionLayout.coffin.y;
    const underworldSectionY = this.y + this.sectionLayout.underworld.y;
    const shrineSectionY = this.y + this.sectionLayout.shrine.y;
    const revivedSectionY = this.y + this.sectionLayout.revived.y;

    this.scene.add.text(this.x + SECTION_X, scoreSectionY + SECTION_HEADER_Y, 'SCORE', this.headingStyle(12)).setDepth(HUD_LAYER_TEXT);
    this.scoreText = this.createLabel(SECTION_X, scoreSectionY + 23 - this.y, 'Score: 0', 12, 1);
    this.chainText = this.createLabel(SECTION_X, scoreSectionY + 39 - this.y, 'Chain: 0', 11, 1);
    this.bestScoreText = this.createLabel(SECTION_X, scoreSectionY + 55 - this.y, 'Best: 0', 11, 1);
    this.levelText = this.createLabel(SECTION_X, scoreSectionY + 70 - this.y, 'Lv: 1', 11, 1);
    this.runTimeText = this.createLabel(SECTION_X, scoreSectionY + 85 - this.y, 'Time: 00:00', 11, 1);
    this.dropsText = this.createLabel(SECTION_X, scoreSectionY + 100 - this.y, 'Drops: 0', 11, 1);
    this.soundText = null;

    this.scene.add.text(this.x + SECTION_X, nextSectionY + SECTION_HEADER_Y, 'NEXT', this.headingStyle(12)).setDepth(HUD_LAYER_TEXT);

    this.scene.add.text(this.x + SECTION_X, coffinSectionY + SECTION_HEADER_Y, 'CURRENT COFFIN', this.headingStyle(12))
      .setDepth(HUD_LAYER_TEXT)
      .setStroke('#120d06', 3);
    this.tierText = this.createLabel(SECTION_X + 2, coffinSectionY + 26 - this.y, 'Tier 1', 10, 1);
    this.godText = this.createLabel(SECTION_X + 2, coffinSectionY + 42 - this.y, 'God: Imsety', 10, 1);
    this.tierText.setDepth(HUD_LAYER_COFFIN_OVERLAY_TEXT);
    this.godText.setDepth(HUD_LAYER_COFFIN_OVERLAY_TEXT);
    this.drawCoffinVisual({ tier: 1, tierName: 'Small Coffin', coffinSize: 'small' });
    this.coffinText = this.createLabel(SECTION_X + 2, coffinSectionY + 180 - this.y, `Meter: 0 / ${COFFIN_METER.requiredByTier[1]}`, 10, 1);
    this.coffinText.setDepth(HUD_LAYER_COFFIN_METER);
    this.coffinText.setStroke('#120d06', 3).setShadow(0, 1, '#000000', 2, true, true);
    this.coffinBarBack = this.scene.add.rectangle(this.x + COFFIN_PANEL_X + COFFIN_PANEL_MARGIN, coffinSectionY + 202, this.coffinBarWidth, COFFIN_BAR_HEIGHT, 0x0b0906, 0.94)
      .setOrigin(0, 0.5)
      .setStrokeStyle(2, 0xd4af37, 0.72)
      .setDepth(HUD_LAYER_COFFIN_BAR_BG);
    this.coffinBarFill = this.scene.add.rectangle(
      this.x + COFFIN_PANEL_X + COFFIN_PANEL_MARGIN + COFFIN_BAR_INSET,
      coffinSectionY + 202,
      this.coffinBarInnerWidth,
      COFFIN_BAR_FILL_HEIGHT,
      0xffd84d,
      0.96,
    ).setOrigin(0, 0.5).setDepth(HUD_LAYER_COFFIN_BAR_FILL);
    this.coffinBarHighlight = this.scene.add.rectangle(
      this.x + COFFIN_PANEL_X + COFFIN_PANEL_MARGIN + COFFIN_BAR_INSET,
      coffinSectionY + 198,
      this.coffinBarInnerWidth,
      2,
      0xffffb8,
      0.58,
    ).setOrigin(0, 0.5).setDepth(HUD_LAYER_COFFIN_BAR_FILL);
    this.updateCoffinBar(0);
    this.unlockedText = this.createLabel(SECTION_X + 2, coffinSectionY + 216 - this.y, 'Awake: 0 / 14', 10, 1);
    this.unlockedText.setDepth(HUD_LAYER_COFFIN_METER);
    this.unlockedText.setStroke('#120d06', 3).setShadow(0, 1, '#000000', 2, true, true);

    this.scene.add.text(this.x + SECTION_X, underworldSectionY + SECTION_HEADER_Y, 'DEPTH', this.headingStyle(12)).setDepth(HUD_LAYER_TEXT);
    this.depthLabelText = this.createLabel(SECTION_X, underworldSectionY + 27 - this.y, 'Depth: 1', 11, 1);
    this.depthProgressLabelText = this.createLabel(SECTION_X, underworldSectionY + 45 - this.y, 'Goal:', 11, 1);
    this.depthProgressText = this.createLabel(SECTION_X + 42, underworldSectionY + 45 - this.y, '0 / 3', 11, 1);
    this.depthProgressText.setColor('#9fdfe8');


    this.scene.add.text(this.x + SECTION_X, shrineSectionY + SECTION_HEADER_Y, 'SHRINE', this.headingStyle(12)).setDepth(HUD_LAYER_TEXT);
    this.shrineEmptyText = this.createLabel(SECTION_X, shrineSectionY + 31 - this.y, 'No awakened gods', 10, 1);
    this.shrineEmptyText.setColor('#7f725f');
    this.shrineIconContainer = this.scene.add.container(this.x + SECTION_X + 18, shrineSectionY + 42).setDepth(HUD_LAYER_TEXT);

    this.feedbackContainer = this.scene.add.container(this.panelCenterX + 8, coffinSectionY + 87)
      .setDepth(HUD_LAYER_UNLOCK_FEEDBACK);
    this.feedbackBackdrop = this.scene.add.rectangle(0, 0, Math.max(122, this.panelWidth - 22), 74, 0x050402, 0.72)
      .setStrokeStyle(1, 0xd4af37, 0.44)
      .setVisible(false);
    this.feedbackText = this.scene.add.text(-52, -27, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      color: '#f4d77a',
      fontStyle: 'bold',
      lineSpacing: 6,
      wordWrap: { width: Math.max(104, this.panelWidth - 40) },
    }).setAlpha(1);
    this.feedbackContainer.add([this.feedbackBackdrop, this.feedbackText]);

    this.createUnlockBadge();

    this.statusText = this.createLabel(90, 28, '', 8);
    this.statusText.setColor('#eadfca');
    this.buildText = this.createLabel(10, this.sectionLayout.towerBottom + 8, `v${GAME_VERSION} / ${COMMIT_SHA}`, 5, 0);
    this.buildText.setColor('#bcae90');
    this.createRevivedSoulsHud();
  }

  createRevivedSoulsHud() {
    const panelX = this.x + 8;
    const panelY = this.y + this.sectionLayout.revived.y;
    this.revivedPanel = this.scene.add.container(panelX, panelY).setDepth(HUD_LAYER_TEXT);
    const panelBack = this.scene.add.rectangle(0, 0, this.panelWidth, HUD_REVIVED_HEIGHT, 0x0d0a06, 0.92)
      .setStrokeStyle(1, 0xd4af37, 0.45)
      .setOrigin(0, 0);
    this.scene.add.text(this.x + SECTION_X, panelY + SECTION_HEADER_Y, 'SOULS', this.headingStyle(12)).setDepth(HUD_LAYER_TEXT);

    this.revivedLabelText = this.scene.add.text(10, 25, 'Revived:', {
      fontFamily: 'Noto Sans JP, Arial, sans-serif',
      fontSize: '11px',
      color: '#f4d77a',
      fontStyle: 'bold',
    });
    this.revivedCountText = this.scene.add.text(78, 24, '×0', {
      fontFamily: 'Georgia, serif',
      fontSize: '13px',
      color: '#e5d0a0',
      fontStyle: 'bold',
    });
    this.revivedIconsContainer = this.scene.add.container(12, 45);
    this.revivedPanel.add([panelBack, this.revivedLabelText, this.revivedCountText, this.revivedIconsContainer]);
    this.revivedPanelBack = panelBack;
  }

  updateRevivedSouls(count) {
    const previousCount = this.revivedCount;
    this.revivedCount = Math.max(0, count);
    this.revivedCountText.setText(`×${this.revivedCount}`);
    this.revivedIconsContainer.setVisible(this.revivedCount > 0);
    this.renderRevivedIcons();
    if (this.revivedCount > previousCount) {
      this.pulseRevivedSoulsCommunity();
    }
  }

  renderRevivedIcons() {
    this.clearRevivedSoulAtmosphere();
    this.revivedIcons.forEach((icon) => icon.destroy());
    this.revivedIcons = [];
    this.revivedIconsContainer.removeAll(true);

    const maxIconsForCompact = Math.min(this.revivedCount, REVIVED_ICON_VISIBLE_MAX);
    const rows = Math.max(1, Math.ceil(maxIconsForCompact / REVIVED_ICON_COLUMNS));
    for (let index = 0; index < maxIconsForCompact; index += 1) {
      const col = index % REVIVED_ICON_COLUMNS;
      const row = Math.floor(index / REVIVED_ICON_COLUMNS);
      const rowWidth = this.resolveRowWidth(row, maxIconsForCompact);
      const colStart = ((REVIVED_ICON_COLUMNS - rowWidth) * REVIVED_ICON_SPACING_X) / 2;
      const iconX = colStart + (col * REVIVED_ICON_SPACING_X);
      const iconY = row * REVIVED_ICON_SPACING_Y;
      const icon = this.scene.add.text(iconX, iconY, '𓀾', {
        fontFamily: 'Georgia, serif',
        fontSize: `${REVIVED_ICON_BASE_FONT_SIZE}px`,
        color: '#d9bb76',
      }).setOrigin(0.5, 0.5).setShadow(0, 0, '#f0c14f', 2, true, true);
      this.revivedIcons.push(icon);
      this.revivedIconsContainer.add(icon);
      this.attachSoulIdle(icon, index, row, rows);
    }

    if (this.revivedCount > REVIVED_ICON_VISIBLE_MAX) {
      const remaining = this.revivedCount - REVIVED_ICON_VISIBLE_MAX;
      const overflowText = this.scene.add.text(76, 13, `+${remaining}`, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '9px',
        color: '#e5d0a0',
        fontStyle: 'bold',
      });
      this.revivedIcons.push(overflowText);
      this.revivedIconsContainer.add(overflowText);
    }
  }

  getRevivedSoulsTargetWorldPoint() {
    return {
      x: this.revivedPanel.x + this.panelWidth - 24,
      y: this.revivedPanel.y + 24,
    };
  }

  pulseRevivedSoulsPanel() {
    if (!this.revivedPanel || !this.revivedPanelBack) {
      return;
    }

    this.scene.tweens.add({
      targets: this.revivedPanelBack,
      alpha: { from: 0.92, to: 1 },
      duration: 180,
      yoyo: true,
      ease: 'Sine.easeInOut',
    });
    this.scene.tweens.add({
      targets: this.revivedPanel,
      scaleX: { from: 1, to: 1.03 },
      scaleY: { from: 1, to: 1.03 },
      duration: 180,
      yoyo: true,
      ease: 'Sine.easeInOut',
    });
  }

  resolveRowWidth(row, visibleCount) {
    const iconsBeforeRow = row * REVIVED_ICON_COLUMNS;
    return Math.min(REVIVED_ICON_COLUMNS, Math.max(0, visibleCount - iconsBeforeRow));
  }

  attachSoulIdle(icon, index, row, totalRows) {
    const depthFactor = Math.max(1, this.revivedDepthLevel);
    const swayAmplitude = 0.6 + (row * 0.08);
    const breatheScale = 1 + Math.min(0.016, 0.01 + (depthFactor - 1) * 0.003);
    const pulseAlpha = 0.9 + Math.min(0.08, (depthFactor - 1) * 0.03);
    const durationOffset = (index % REVIVED_ICON_COLUMNS) * 120;
    const rowDelay = (totalRows - row) * 40;

    const swayTween = this.scene.tweens.add({
      targets: icon,
      x: icon.x + swayAmplitude,
      duration: 2600 + durationOffset + rowDelay,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    const breathTween = this.scene.tweens.add({
      targets: icon,
      scaleX: breatheScale,
      scaleY: breatheScale + 0.004,
      alpha: pulseAlpha,
      duration: 1800 + durationOffset,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    this.revivedIconTweens.push(swayTween, breathTween);

    if (depthFactor >= 3) {
      const timer = this.scene.time.addEvent({
        delay: 2400 + (index * 180),
        loop: true,
        callback: () => {
          if (!icon.active) {
            return;
          }
          this.scene.tweens.add({
            targets: icon,
            alpha: { from: icon.alpha, to: Math.max(0.72, icon.alpha - 0.18) },
            duration: 100,
            yoyo: true,
            ease: 'Sine.easeInOut',
          });
        },
      });
      this.revivedEyeTimers.push(timer);
    }
  }

  pulseRevivedSoulsCommunity() {
    if (!this.revivedIcons.length) {
      return;
    }
    this.revivedIcons.forEach((icon, index) => {
      this.scene.tweens.add({
        targets: icon,
        scaleX: 1.08,
        scaleY: 1.08,
        duration: 130,
        delay: index * 24,
        yoyo: true,
        ease: 'Sine.easeOut',
      });
    });
  }

  clearRevivedSoulAtmosphere() {
    this.revivedIconTweens.forEach((tween) => tween?.stop());
    this.revivedEyeTimers.forEach((timer) => timer?.remove(false));
    this.revivedIconTweens = [];
    this.revivedEyeTimers = [];
  }

  createUnlockBadge() {
    const badgeX = this.panelCenterX + 8;
    const badgeY = this.y + this.sectionLayout.coffin.y + Math.floor(HUD_COFFIN_HEIGHT / 2);
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


  buildSectionLayout() {
    const scoreY = HUD_STACK_START_Y;
    const nextY = scoreY + HUD_TOP_HEIGHT + HUD_SECTION_GAP;
    const coffinY = nextY + HUD_NEXT_HEIGHT + HUD_SECTION_GAP;
    const underworldY = coffinY + HUD_COFFIN_HEIGHT + HUD_SECTION_GAP;
    const shrineY = underworldY + HUD_UNDERWORLD_HEIGHT + HUD_SECTION_GAP;
    const revivedY = shrineY + HUD_SHRINE_HEIGHT + HUD_SECTION_GAP;
    return {
      score: { y: scoreY, height: HUD_TOP_HEIGHT },
      next: { y: nextY, height: HUD_NEXT_HEIGHT },
      coffin: { y: coffinY, height: HUD_COFFIN_HEIGHT },
      underworld: { y: underworldY, height: HUD_UNDERWORLD_HEIGHT },
      shrine: { y: shrineY, height: HUD_SHRINE_HEIGHT },
      revived: { y: revivedY, height: HUD_REVIVED_HEIGHT },
      towerBottom: revivedY + HUD_REVIVED_HEIGHT,
    };
  }

  createPanels() {
    const panelAreaHeight = HUD_TOWER_HEIGHT + (HUD_PANEL_INSET * 2);
    this.scene.add.rectangle(this.x + this.width / 2, this.y + 40 + (panelAreaHeight / 2), this.width, panelAreaHeight, 0x100b06, 0.9)
      .setStrokeStyle(2, PANEL_STROKE, 0.58)
      .setDepth(HUD_LAYER_BASE);

    this.createPanel(8, this.sectionLayout.score.y, this.panelWidth, HUD_TOP_HEIGHT, '');
    this.createPanel(8, this.sectionLayout.next.y, this.panelWidth, HUD_NEXT_HEIGHT, '');
    this.coffinPanel = this.createPanel(COFFIN_PANEL_X, this.sectionLayout.coffin.y, this.panelWidth, COFFIN_PANEL_HEIGHT, '');
    this.createPanel(8, this.sectionLayout.underworld.y, this.panelWidth, HUD_UNDERWORLD_HEIGHT, '');
    this.createPanel(8, this.sectionLayout.shrine.y, this.panelWidth, HUD_SHRINE_HEIGHT, '');
    this.createPanel(8, this.sectionLayout.revived.y, this.panelWidth, HUD_REVIVED_HEIGHT, '');

    this.drawEgyptianAccents();
  }

  createPanel(offsetX, offsetY, width, height) {
    const panel = this.scene.add.rectangle(this.x + offsetX, this.y + offsetY, width, height, PANEL_FILL, 0.84)
      .setOrigin(0, 0)
      .setStrokeStyle(1, PANEL_STROKE, 0.38)
      .setDepth(HUD_LAYER_BASE + 1);
    this.scene.add.rectangle(this.x + offsetX + 6, this.y + offsetY + 6, width - 12, height - 12, PANEL_STONE, 0.22)
      .setOrigin(0, 0)
      .setStrokeStyle(1, 0xf0d27a, 0.08)
      .setDepth(HUD_LAYER_BASE + 1);
    return panel;
  }

  drawEgyptianAccents() {
    const graphics = this.scene.add.graphics();
    graphics.lineStyle(1, 0xf0d27a, 0.38);
    [this.sectionLayout.score.y + 12, this.sectionLayout.next.y + 12, this.sectionLayout.coffin.y + 12, this.sectionLayout.underworld.y + 12, this.sectionLayout.shrine.y + 12, this.sectionLayout.revived.y + 12].forEach((offsetY) => {
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

  updateRunPerformance(runTimeText, placedPieceCount) {
    this.runTimeText.setText(`Time: ${runTimeText}`);
    this.dropsText.setText(`Drops: ${placedPieceCount}`);
  }

  updateUnderworldDepth(currentDepthLevel, totalPureCanopicCount, depthThresholds) {
    const depthLevel = Math.max(1, Number(currentDepthLevel) || 1);
    const isMaxDepth = depthLevel >= depthThresholds.length;
    this.depthLabelText.setText(`Depth: ${depthLevel}`);
    if (isMaxDepth) {
      this.depthProgressText.setText('MAX');
      return;
    }

    const startThreshold = depthThresholds[depthLevel - 1] ?? 0;
    const nextThreshold = depthThresholds[depthLevel] ?? startThreshold;
    const progress = Math.max(0, totalPureCanopicCount - startThreshold);
    const needed = Math.max(1, nextThreshold - startThreshold);
    this.depthProgressText.setText(`${Math.min(progress, needed)} / ${needed}`);
  }

  updateSoundStatus(isSoundOn) {
    if (!this.soundText) {
      return;
    }
    this.soundText.setText(`SND: ${isSoundOn ? 'ON' : 'OFF'}`);
    this.soundText.setColor(isSoundOn ? '#9fdfe8' : '#c2b39c');
  }

  setDebugMode(isEnabled) {
    this.isDebugMode = Boolean(isEnabled);
    this.debugText.setVisible(isEnabled);
  }


  updateBombStock(stock, selectedSlot = null) {
    const normalizedStock = Array.isArray(stock) ? stock.map((bomb) => (bomb ? { ...bomb } : null)) : [];
    this.lastBombStockForShrine = normalizedStock;
    this.lastSelectedBombSlotForShrine = selectedSlot;
    this.renderShrine();
    this.emitBombButtonState(normalizedStock, selectedSlot);
  }

  emitBombButtonState(stock, selectedSlot = null) {
    if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') {
      return;
    }

    const slots = [0, 1, 2, 3].map((index) => {
      const bomb = stock[index] ?? null;
      const god = bomb ? this.getGodForBomb(bomb) : null;
      const asset = god
        ? getCoffinAssetForGod(god, this.scene, {
          debug: this.isDebugMode,
          variant: COFFIN_ASSET_VARIANTS.ICON,
        })
        : null;
      return {
        index,
        label: `B${index + 1}`,
        isAssigned: Boolean(bomb),
        isSelected: index === selectedSlot,
        godId: god?.id ?? bomb?.godId ?? null,
        godName: god?.name ?? bomb?.godName ?? null,
        bombType: bomb?.type ?? null,
        assetKey: asset?.key ?? null,
        assetPath: asset?.path ?? asset?.fallbackAsset?.path ?? null,
      };
    });

    window.dispatchEvent(new CustomEvent('duat-bomb-buttons-state', { detail: { slots } }));
  }

  refreshBombButtonAssets() {
    this.emitBombButtonState(this.lastBombStockForShrine ?? [], this.lastSelectedBombSlotForShrine);
  }

  getGodForBomb(bomb) {
    return GODS.find((god) => god.id === bomb?.godId)
      ?? GODS.find((god) => god.name === bomb?.godName)
      ?? null;
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
    const {
      currentGod,
      currentTier,
      coffinDisplayGod,
      currentDisplayGod,
      coffinDisplayTier,
      currentDisplayTier,
      progress,
      unlockedCount,
      totalGods,
      isComplete,
      isDisplayComplete,
    } = state;
    const displayGod = coffinDisplayGod ?? currentDisplayGod ?? currentGod;
    const displayTier = coffinDisplayTier ?? currentDisplayTier ?? currentTier;
    const displayComplete = isDisplayComplete ?? isComplete;

    if (displayComplete) {
      this.tierText.setText('Tier 4');
      this.godText.setText('End: DUAT COMPLETE');
      this.coffinText.setText('Meter: 完了');
      this.drawCoffinVisual(displayTier, displayGod);
    } else {
      this.tierText.setText(`Tier ${displayTier.tier}`);
      this.godText.setText(`God: ${displayGod.name}`);
      this.coffinText.setText(`Meter: ${progress.value} / ${progress.required}`);
      this.drawCoffinVisual(displayTier, displayGod);
    }

    this.unlockedText.setText(`Awake: ${unlockedCount} / ${totalGods}`);
    this.updateCoffinBar(progress.ratio);
    this.pulseCoffinBarOnGain(displayGod, progress);
    this.updateAwakenedCoffinPresence(unlockedCount);
  }

  updateAwakenedGodsPresence(awakenedGods, usedGodIds = new Set()) {
    const gods = Array.isArray(awakenedGods) ? awakenedGods : [];
    this.lastUnlockedGodsForShrine = gods.map((god) => ({ ...god }));
    this.lastUsedGodIdsForShrine = this.normalizeGodIdSet(usedGodIds);
    this.renderShrine();
  }

  renderShrine() {
    if (!this.shrineIconContainer || !this.shrineEmptyText) {
      return;
    }

    this.shrinePulseTweens.forEach((tween) => tween?.stop());
    this.shrinePulseTweens = [];
    this.shrineIconContainer.removeAll(true);
    this.shrineIcons = [];

    const unlockedGods = this.lastUnlockedGodsForShrine ?? [];
    this.shrineEmptyText.setVisible(unlockedGods.length === 0);
    if (unlockedGods.length === 0) {
      return;
    }

    const stock = this.lastBombStockForShrine ?? [];
    const selectedBomb = Number.isInteger(this.lastSelectedBombSlotForShrine)
      ? stock[this.lastSelectedBombSlotForShrine]
      : null;
    const assignedGodIds = new Set(stock.map((bomb) => bomb?.godId).filter(Boolean));
    const usedGodIds = this.lastUsedGodIdsForShrine ?? new Set();

    unlockedGods.slice(0, SHRINE_ICON_COLUMNS * 2).forEach((god, index) => {
      const row = Math.floor(index / SHRINE_ICON_COLUMNS);
      const col = index % SHRINE_ICON_COLUMNS;
      const x = col * SHRINE_ICON_SPACING_X;
      const y = row * SHRINE_ICON_SPACING_Y;
      const isUnused = !usedGodIds.has(god.id);
      const isAssigned = assignedGodIds.has(god.id);
      const isSelected = selectedBomb?.godId === god.id;
      const icon = this.createShrineIcon(god, x, y, isUnused, isAssigned, isSelected);

      this.shrineIconContainer.add(icon);
      this.shrineIcons.push(icon);
    });
  }

  normalizeGodIdSet(godIds) {
    if (godIds instanceof Set) {
      return new Set([...godIds].filter(Boolean));
    }

    if (Array.isArray(godIds)) {
      return new Set(godIds.filter(Boolean));
    }

    return new Set();
  }

  createShrineIcon(god, x, y, isUnused, isAssigned, isSelected) {
    const container = this.scene.add.container(x, y);
    container.godId = god.id;
    const backAlpha = isAssigned ? 0.34 : 0.18;
    const back = this.scene.add.rectangle(0, 0, SHRINE_ICON_SIZE + 4, SHRINE_ICON_SIZE + 4, 0x050402, backAlpha)
      .setStrokeStyle(1, isAssigned ? 0xffdf6e : 0xd4af37, isAssigned ? 0.86 : 0.22);
    const asset = getCoffinAssetForGod(god, this.scene, {
      debug: this.isDebugMode,
      variant: COFFIN_ASSET_VARIANTS.ICON,
    });
    const coffin = this.createShrineCoffinDisplay(asset)
      .setAlpha(isUnused ? 1 : SHRINE_USED_ALPHA);

    if (!isUnused && typeof coffin.setTint === 'function') {
      coffin.setTint(0x5f574c);
    }

    container.add([back, coffin]);

    if (isAssigned) {
      const highlight = this.scene.add.rectangle(0, 0, SHRINE_ICON_SIZE + 8, SHRINE_ICON_SIZE + 8, 0xffdf6e, 0)
        .setStrokeStyle(isSelected ? 2 : 1, 0xffdf6e, isSelected ? 0.94 : 0.76);
      container.addAt(highlight, 0);

      if (isSelected) {
        this.shrinePulseTweens.push(this.scene.tweens.add({
          targets: highlight,
          alpha: { from: 0.86, to: 0.34 },
          scaleX: { from: 1, to: 1.08 },
          scaleY: { from: 1, to: 1.08 },
          duration: 620,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        }));
      }
    }

    return container;
  }

  createShrineCoffinDisplay(asset) {
    if (!asset || !this.scene.textures.exists(asset.key)) {
      const fallback = this.scene.add.rectangle(0, 0, SHRINE_ICON_SIZE * 0.58, SHRINE_ICON_SIZE, 0x3a2a1a, 1)
        .setStrokeStyle(1, 0xd4af37, 0.85);
      return fallback;
    }

    const source = this.scene.textures.get(asset.key).getSourceImage();
    const scale = Math.min(SHRINE_ICON_SIZE / source.width, SHRINE_ICON_SIZE / source.height);
    return this.scene.add.image(0, 0, asset.key)
      .setDisplaySize(source.width * scale, source.height * scale);
  }

  updateAwakenedCoffinPresence(unlockedCount) {
    const awakenRatio = Phaser.Math.Clamp((Number(unlockedCount) || 0) / 14, 0, 1);
    const strokeAlpha = 0.24 + awakenRatio * 0.3;
    if (this.coffinPanel) {
      this.coffinPanel.setStrokeStyle(1, PANEL_STROKE, strokeAlpha);
    }
    if (this.coffinGlow) {
      this.coffinGlow.setAlpha(0.08 + awakenRatio * 0.09);
    }
  }

  pulseAwakenedSigil(godId) {
    if (!godId) {
      return;
    }

    const shrineIcon = this.shrineIcons.find((icon) => icon.godId === godId);
    if (!shrineIcon) {
      return;
    }

    this.scene.tweens.add({
      targets: shrineIcon,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 160,
      yoyo: true,
      repeat: 1,
      ease: 'Sine.easeInOut',
    });
  }

  pulseCurrentCoffin(godId) {
    if (!this.coffinContainer || !this.coffinGlow) {
      return;
    }
    const pulseColors = {
      imsety: 0xe8c76e,
      hapy: 0x8ecff2,
      duamutef: 0xe09a6c,
      qebehsenuef: 0xb794f8,
    };
    const pulseColor = pulseColors[godId] ?? 0xd4af37;
    const originalGlowAlpha = this.coffinGlow.alpha;
    this.coffinGlow.setFillStyle(pulseColor, originalGlowAlpha);
    this.scene.tweens.add({
      targets: this.coffinContainer,
      scaleX: 1.024,
      scaleY: 1.024,
      duration: 180,
      yoyo: true,
      ease: 'Sine.easeInOut',
    });
    this.scene.tweens.add({
      targets: this.coffinGlow,
      alpha: Math.min(0.24, originalGlowAlpha + 0.12),
      duration: 190,
      yoyo: true,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this.coffinGlow.setFillStyle(0xd4af37, this.coffinGlow.alpha);
      },
    });
  }

  refreshCoffinVisual() {
    if (!this.currentCoffinTier) {
      return;
    }

    this.currentCoffinVisualId = null;
    this.drawCoffinVisual(this.currentCoffinTier, this.currentCoffinGod);
  }

  drawCoffinVisual(currentTier, currentGod = null) {
    this.currentCoffinTier = currentTier;
    this.currentCoffinGod = currentGod;
    const stage = currentGod?.stage ?? currentTier?.stage ?? 1;
    const asset = getCoffinAssetForGod(currentGod, this.scene, {
      debug: this.isDebugMode,
      variant: COFFIN_ASSET_VARIANTS.HIGH,
    });
    const nextVisualId = `${currentGod?.id ?? stage}:${asset.key}`;

    if (this.coffinContainer && this.currentCoffinVisualId === nextVisualId) {
      return;
    }

    if (this.coffinGlowTween) {
      this.coffinGlowTween.stop();
      this.coffinGlowTween = null;
    }

    if (this.coffinContainer) {
      this.coffinContainer.destroy(true);
    }

    const centerX = this.panelCenterX;
    const centerY = this.y + this.sectionLayout.coffin.y + 112;
    const container = this.scene.add.container(centerX, centerY).setDepth(HUD_LAYER_COFFIN);
    const glowSize = Math.max(this.coffinImageAreaWidth, COFFIN_IMAGE_AREA_HEIGHT) + 18;

    const backplate = this.scene.add.rectangle(0, 0, this.coffinImageAreaWidth, COFFIN_IMAGE_AREA_HEIGHT, 0x0b0906, 0.38)
      .setStrokeStyle(1, 0xd4af37, 0.24);
    this.coffinGlow = this.scene.add.ellipse(0, 0, glowSize, glowSize, 0xd4af37, 0.08)
      .setStrokeStyle(2, 0xf4d77a, 0.16);
    const coffin = this.createCoffinDisplay(asset, currentTier.tier);

    container.add([backplate, this.coffinGlow, coffin]);
    this.coffinContainer = container;
    this.currentCoffinVisualId = nextVisualId;
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
      this.coffinImageAreaWidth / source.width,
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
    const replacementNotice = this.getBombReplacementNotice(latestUnlock);
    const badgeMessage = [
      `神、目覚める\n${god?.name}\n授与ボム: ${bombName}`,
      replacementNotice,
    ].filter(Boolean).join('\n');

    this.flashCoffin(tier);
    this.flashCoffinPanel(tier);
    this.showUnlockBadge(badgeMessage, replacementNotice ? 2400 : 1900);
  }

  getBombReplacementNotice(unlockEvent) {
    const returnedGodName = unlockEvent?.replacedBomb?.godName;
    const equippedGodName = unlockEvent?.grantedBomb?.godName;

    if (!returnedGodName || !equippedGodName) {
      return '';
    }

    return `${returnedGodName} returned to Shrine\n${equippedGodName} equipped`;
  }

  getUnlockGrantedBombLabel(unlockEvent) {
    const grantedBombType = unlockEvent?.grantedBomb?.type;
    if (grantedBombType) {
      return BOMB_LABELS_JA[grantedBombType] ?? grantedBombType;
    }

    if (unlockEvent?.grantStatus === 'replaced') {
      return '装備';
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

  showPureCanopicRitual(currentGod) {
    this.flashCoffinPanel(currentGod?.tier ?? 1);
    this.pulsePureCanopicCoffin();
    this.showPureCanopicGodAwakens(currentGod);
  }

  pulsePureCanopicCoffin() {
    if (!this.coffinGlow || !this.coffinContainer || !this.coffinBarFill || !this.coffinBarHighlight) {
      return;
    }

    if (this.pureCanopicCoffinTween) {
      this.pureCanopicCoffinTween.stop();
      this.pureCanopicCoffinTween = null;
    }

    const baseFillScaleX = this.coffinBarFill.scaleX;
    this.coffinGlow.setAlpha(0.1);
    this.coffinContainer.setScale(1);
    this.coffinBarBack.setStrokeStyle(2, 0xf4d77a, 0.72);
    this.coffinBarFill.setFillStyle(0xf8e08a, 0.98);
    this.coffinBarHighlight.setAlpha(0.76);

    this.pureCanopicCoffinTween = this.scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration: 260,
      ease: 'Sine.easeInOut',
      yoyo: true,
      onUpdate: (tween) => {
        const t = tween.getValue();
        this.coffinGlow.setAlpha(0.1 + t * 0.16);
        this.coffinContainer.setScale(1 + t * 0.018);
        this.coffinBarHighlight.setAlpha(0.76 + t * 0.18);
        this.coffinBarFill.setScale(baseFillScaleX, 1 + t * 0.05);
      },
      onComplete: () => {
        this.coffinGlow.setAlpha(0.08);
        this.coffinContainer.setScale(1);
        this.coffinBarFill.setScale(baseFillScaleX, 1);
        this.coffinBarFill.setFillStyle(0xffd84d, 0.96);
        this.coffinBarHighlight.setAlpha(0.58);
        this.coffinBarBack.setStrokeStyle(2, 0xd4af37, 0.72);
        this.pureCanopicCoffinTween = null;
      },
    });
  }

  showPureCanopicGodAwakens(currentGod) {
    if (!this.feedbackText || !currentGod?.name) {
      return;
    }

    if (this.pureCanopicTextTween) {
      this.pureCanopicTextTween.stop();
      this.pureCanopicTextTween = null;
    }

    if (this.pureCanopicTextTimer) {
      this.pureCanopicTextTimer.remove(false);
      this.pureCanopicTextTimer = null;
    }

    const awakenName = `${currentGod.name.toUpperCase()} AWAKENS`;
    this.feedbackText.setText(awakenName);
    this.feedbackText.setColor('#f4e3a6');
    this.feedbackText.setStroke('#2a1a08', 4);
    this.feedbackText.setAlpha(0);
    this.feedbackBackdrop.setVisible(true);
    this.feedbackBackdrop.setAlpha(0.44);

    this.pureCanopicTextTween = this.scene.tweens.add({
      targets: this.feedbackText,
      alpha: { from: 0, to: 0.96 },
      duration: 150,
      ease: 'Sine.easeOut',
      onComplete: () => {
        this.pureCanopicTextTween = null;
      },
    });

    this.pureCanopicTextTimer = this.scene.time.delayedCall(520, () => {
      this.pureCanopicTextTween = this.scene.tweens.add({
        targets: [this.feedbackText, this.feedbackBackdrop],
        alpha: 0,
        duration: 180,
        ease: 'Sine.easeInOut',
        onComplete: () => {
          this.feedbackText.setText('');
          this.feedbackText.setAlpha(1);
          this.feedbackText.setColor('#ffe8ab');
          this.feedbackText.setStroke('#2a1707', 3);
          this.feedbackBackdrop.setVisible(false);
          this.feedbackBackdrop.setAlpha(0.66);
          this.pureCanopicTextTween = null;
        },
      });
      this.pureCanopicTextTimer = null;
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

  updateDepthAtmosphere(depthLevel, profile) {
    const normalizedDepth = Math.max(1, Number(depthLevel) || 1);
    const depthBoost = Math.min(0.12, 0.03 * (normalizedDepth - 1));
    const lineAlpha = Math.min(0.42, 0.22 + depthBoost + ((profile?.pulseAlpha ?? 0) * 0.7));
    const glowAlpha = Math.min(0.2, 0.08 + depthBoost + ((profile?.eyeGlowAlpha ?? 0) * 0.8));
    const panelAlpha = Math.min(0.9, 0.84 + (depthBoost * 0.4));

    if (this.coffinPanel) {
      this.coffinPanel.setFillStyle(PANEL_FILL, panelAlpha);
      this.coffinPanel.setStrokeStyle(1, PANEL_STROKE, lineAlpha);
    }
    if (this.coffinGlow) {
      this.coffinGlow.setAlpha(glowAlpha);
    }
    if (this.coffinBarBack) {
      this.coffinBarBack.setStrokeStyle(2, 0xd4af37, Math.min(0.88, 0.72 + depthBoost));
    }
    this.revivedDepthLevel = normalizedDepth;
    if (this.revivedPanelBack) {
      const revivedPanelAlpha = Math.min(0.95, 0.92 + (normalizedDepth - 1) * 0.01);
      const revivedStrokeAlpha = Math.min(0.65, 0.45 + (normalizedDepth - 1) * 0.08);
      this.revivedPanelBack.setFillStyle(0x0d0a06, revivedPanelAlpha);
      this.revivedPanelBack.setStrokeStyle(1, normalizedDepth >= 2 ? 0xf0d27a : 0xd4af37, revivedStrokeAlpha);
    }
  }

  pulseDepthTransition() {
    if (!this.coffinPanel || !this.coffinGlow) {
      return;
    }
    if (this.depthAtmosphereTween) {
      this.depthAtmosphereTween.stop();
      this.depthAtmosphereTween = null;
    }
    const baseGlowAlpha = this.coffinGlow.alpha;
    const previousStrokeAlpha = this.coffinPanel.strokeAlpha ?? 0.38;
    this.depthAtmosphereTween = this.scene.tweens.add({
      targets: this.coffinGlow,
      alpha: Math.min(0.26, baseGlowAlpha + 0.08),
      duration: 240,
      yoyo: true,
      ease: 'Sine.easeInOut',
      onStart: () => {
        this.coffinPanel.setStrokeStyle(1, PANEL_STROKE, 0.56);
      },
      onComplete: () => {
        this.coffinPanel.setStrokeStyle(1, PANEL_STROKE, previousStrokeAlpha);
        this.depthAtmosphereTween = null;
      },
    });
  }

  drawNext(types) {
    this.clearNext();

    const startX = this.x + 28;
    const startY = this.y + this.sectionLayout.next.y + 39;

    types.forEach((type, index) => {
      const y = startY + index * 34;
      const block = this.drawNextBlock(startX, y, type);
      const label = this.scene.add.text(startX + 31, y - 8, PIECE_LABELS[type], {
        fontFamily: 'Arial, sans-serif',
        fontSize: '11px',
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

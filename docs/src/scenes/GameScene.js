import {
  BOARD_COLUMNS,
  BOARD_ROWS,
  BOARD_AREA_RATIO,
  GAME_HEIGHT,
  GAME_WIDTH,
  HUD_AREA_RATIO,
  HUD_ORIGIN_Y,
  INITIAL_LEVEL,
  INITIAL_SCORE,
  LOCK_DELAY_MS,
  NORMAL_FALL_MS,
  SOFT_DROP_FALL_MS,
} from '../data/constants.js';
import { createRandomPairTypes, getPieceAsset, PIECE_COLORS, preloadPieceAssets } from '../data/pieces.js';
import { preloadCoffinAssets } from '../data/coffins.js';
import { Board } from '../core/Board.js';
import { Piece } from '../core/Piece.js';
import { GravitySystem } from '../core/GravitySystem.js';
import { MatchResolver } from '../core/MatchResolver.js';
import { CanopusResolver } from '../core/CanopusResolver.js';
import { ScoreSystem } from '../core/ScoreSystem.js';
import { CoffinMeter } from '../core/CoffinMeter.js';
import { BombSystem } from '../core/BombSystem.js';
import { HighScoreManager } from '../core/HighScoreManager.js';
import { Hud } from '../ui/Hud.js';
import { SoundManager } from '../audio/SoundManager.js';
import { BgmManager, getBgmKey, preloadBgmAssets } from '../audio/BgmManager.js';
import { TOTAL_GOD_COUNT } from '../data/gods.js';
import { COFFIN_METER, DANGER_BGM, UNDERWORLD_DEPTH } from '../data/balance.js';
import { GAME_VERSION, BUILD_LABEL, COMMIT_SHA } from '../data/buildInfo.js';

const BOMB_AREA_FLASH_MS = 400;
const BOMB_AREA_FLASH_COLOR = 0xd4af37;
const BOMB_PREVIEW_ALPHA_SCALE = 0.42;
const BOMB_AREA_FLASH_STYLES = {
  brain_clear: { fill: 0x4b5dff, stroke: 0x9b62c9, alpha: 0.28 },
  knowledge_convert: { fill: 0x62f4ff, stroke: 0xf4d77a, alpha: 0.3 },
  protective_clear: { fill: 0xf4d77a, stroke: 0xffe6a0, alpha: 0.27 },
  war_burst: { fill: 0xc0392b, stroke: 0xf4d77a, alpha: 0.3 },
  triple_column_clear: { fill: 0xf4d77a, stroke: 0xfff0a8, alpha: 0.31 },
  piece_transform: { fill: 0x62f4ff, stroke: 0xfff0a8, alpha: 0.32 },
  half_board_reset: { fill: 0xb8860b, stroke: 0xf4d77a, alpha: 0.28 },
  chaos_clear: { fill: 0x7b2d8b, stroke: 0xf4d77a, alpha: 0.34 },
  full_board_clear: { fill: 0xf4d77a, stroke: 0xffffff, alpha: 0.34 },
  maximum_coffin_burst: { fill: 0xfff0a8, stroke: 0xc0392b, alpha: 0.44, strokeWidth: 3 },
};
const SAME_TYPE_CLEAR_FLASH_MS = 300;
const CANOPIC_CLEAR_FLASH_MS = 420;
const ADJACENT_BRAIN_CLEAR_FLASH_MS = 360;
const SAME_TYPE_CLEAR_FLASH_COLOR = 0xf4d77a;
const CANOPIC_CLEAR_FLASH_COLOR = 0x62f4ff;
const CANOPIC_CLEAR_STROKE_COLOR = 0xf4d77a;
const CLEAR_PARTICLE_DEPTH = 11;
const CLEAR_PARTICLE_LIFETIME_MIN_MS = 300;
const CLEAR_PARTICLE_LIFETIME_MAX_MS = 600;
const CLEAR_PARTICLE_BASE_SPEED = 12;
const CLEAR_PARTICLE_SPEED_SCALE = 0.24;
const CLEAR_PARTICLE_BASE_RADIUS = 2;
const CLEAR_PARTICLE_RADIUS_SCALE = 0.06;
const BOARD_GRAVITY_STEP_MS = 55;
const BOARD_FEEDBACK_DEPTH = 26;
const CLEAR_HIT_STOP_MIN_MS = 50;
const CLEAR_HIT_STOP_MAX_MS = 90;
const CAMERA_SHAKE_DURATION_MS = 80;
const CAMERA_SHAKE_BASE_INTENSITY = 0.0008;
const CAMERA_SHAKE_CHAIN_SCALE = 0.0005;
const PURE_CANOPIC_PULSE_DEPTH = 25;
const PURE_CANOPIC_PULSE_DURATION_MS = 320;
const PURE_CANOPIC_HIT_STOP_MS = 210;
const GOD_AWAKENING_PRESENCE_MS = 680;
const GOD_AWAKENING_RIPPLE_MAX_RADIUS = 260;
const SOUL_ASCENT_DEPTH = 45;
const SOUL_FLOAT_UP_MS = 170;
const SOUL_TO_HUD_MS = 300;
const CHAIN_POPUP_DEPTH = 46;
const CHAIN_POPUP_TOP_OFFSET = 26;
const CHAIN_POPUP_RISE_START_OFFSET = 32;
const CHAIN_POPUP_RISE_END_OFFSET = 18;
const PURE_CANOPIC_POPUP_DEPTH = 47;
const PIECE_CONNECTOR_DEPTH = 3;
const PIECE_SPRITE_DEPTH = 4;
const CONNECTOR_ALPHA = 0.4;
const CONNECTOR_PULSE_ALPHA_MIN = 0.55;
const CONNECTOR_PULSE_ALPHA_MAX = 0.8;
const CONNECTOR_PULSE_DURATION_MS = 1150;
const CONNECTOR_PULSE_GROUP_ALPHA_BOOST = 0.03;
const CONNECTOR_PULSE_GROUP_ALPHA_BOOST_MAX = 0.08;
const CONNECTOR_TINT_DARKEN = 0.4;
const CONNECTOR_TINT_DARKEN_LARGE_GROUP = 0.48;
const CONNECTOR_THICKNESS_RATIO = 0.58;
const CONNECTOR_LENGTH_RATIO = 0.76;
const CONNECTOR_BULGE_RATIO = 0.32;
const DANGER_ENTER_ROW = DANGER_BGM.enterRow;
const DANGER_EXIT_ROW = DANGER_BGM.exitRow;
const LAYOUT_CONFIG = {
  sidePadding: 16,
  gap: 8,
  boardTopPadding: 12,
  boardBottomPadding: 12,
  portraitMaxCellSize: 50,
};
const SHOW_LAYOUT_DEBUG_OVERLAY_IN_DEV = true;

const TITLE_DUST_PARTICLE_COUNT = 18;
const TITLE_DUST_DRIFT_MIN_MS = 6800;
const TITLE_DUST_DRIFT_MAX_MS = 12200;
const TITLE_LOGO_STEP_MS = 700;
const TITLE_LOGO_FADE_MS = 1400;
const TITLE_COFFIN_PULSE_SCALE = 1.018;
const TITLE_COFFIN_PULSE_MS = 3200;
const TITLE_AMBIENT_SHIMMER_MS = 5600;
const TITLE_PROMPT_PULSE_MS = 2200;
const TITLE_GOD_NAME_INTERVAL_MIN_MS = 7000;
const TITLE_GOD_NAME_INTERVAL_MAX_MS = 14000;
const DEPTH_TRANSITION_DEPTH = 48;
const DEPTH_MAX_LEVEL = UNDERWORLD_DEPTH.maxLevel;
const DEPTH_PURE_CANOPIC_THRESHOLDS = UNDERWORLD_DEPTH.pureCanopicThresholds;
const DEPTH_TRANSITION_MESSAGES = [
  'UNDERWORLD DEPTH I',
  'UNDERWORLD DEPTH II',
  'UNDERWORLD DEPTH III',
];
const DEPTH_ATMOSPHERE_PROFILES = [
  {
    tintColor: 0x1b140d,
    tintAlpha: 0.08,
    fogColor: 0x6b5a3a,
    fogAlpha: 0.03,
    fogScale: 1,
    glowColor: 0xd4af37,
    glowAlpha: 0.04,
    pulseLineColor: 0xd9b26a,
    pulseAlpha: 0.05,
    pulseStrength: 0.018,
    ambientDrift: 1,
    corruptionAlpha: 0,
    eyeGlowAlpha: 0,
    dustCount: 12,
    dustAlpha: 0.2,
    dustDriftMinMs: 5200,
    dustDriftMaxMs: 9400,
  },
  {
    tintColor: 0x160f1f,
    tintAlpha: 0.14,
    fogColor: 0x4c4f66,
    fogAlpha: 0.06,
    fogScale: 1.04,
    glowColor: 0x9fd6ff,
    glowAlpha: 0.07,
    pulseLineColor: 0x9fd6ff,
    pulseAlpha: 0.08,
    pulseStrength: 0.026,
    ambientDrift: 1.2,
    corruptionAlpha: 0.03,
    eyeGlowAlpha: 0.02,
    dustCount: 16,
    dustAlpha: 0.24,
    dustDriftMinMs: 5000,
    dustDriftMaxMs: 9000,
  },
  {
    tintColor: 0x0f0f26,
    tintAlpha: 0.2,
    fogColor: 0x42375c,
    fogAlpha: 0.1,
    fogScale: 1.08,
    glowColor: 0xa9a2ff,
    glowAlpha: 0.1,
    pulseLineColor: 0xb2a8ff,
    pulseAlpha: 0.11,
    pulseStrength: 0.034,
    ambientDrift: 1.35,
    corruptionAlpha: 0.07,
    eyeGlowAlpha: 0.06,
    dustCount: 20,
    dustAlpha: 0.28,
    dustDriftMinMs: 4600,
    dustDriftMaxMs: 8400,
  },
];

const GAME_STATES = {
  TITLE: 'title',
  PLAYING: 'playing',
  PAUSED: 'paused',
  GAME_OVER: 'gameOver',
};

const ENDING_TYPES = {
  STANDARD_GAME_OVER: 'standard_game_over',
  NORMAL_END: 'normal_end',
  TRUE_END: 'true_end',
};
const RITUAL_SOUL_CAP = 28;
const PYRAMID_MIN_TIERS = 2;
const PYRAMID_MAX_TIERS = 12;

const BOMB_LABELS_JA = {
  vertical_clear: '縦消し',
  horizontal_clear: '横消し',
  cross_clear: '十字消し',
  surround_clear: '周囲消し',
  brain_clear: '脳消し',
  knowledge_convert: '変換',
  protective_clear: '守護消し',
  war_burst: '爆裂',
  triple_column_clear: '3列消し',
  piece_transform: '変化',
  half_board_reset: '半面整理',
  chaos_clear: '混沌',
  full_board_clear: '全消し',
  maximum_coffin_burst: '最大爆発',
};

const HOW_TO_PLAY_PAGES = [
  {
    title: '遊び方 1/6：操作',
    lines: [
      '・← / →：移動',
      '・↓：ソフトドロップ',
      '・↑ / Z：回転',
      '・Space：ハードドロップ',
      '・Enter：ポーズ / 再開 / リスタート',
      '・1〜4：ボム選択',
      '・Esc：選択解除',
      '・M：ミュート',
    ],
  },
  {
    title: '遊び方 2/6：基本ルール',
    lines: [
      '・落ちてくる2つのピースを操作します。',
      '・同じ臓器を4つ以上つなげると消えます。',
      '・消えるとスコアと棺メーターが増えます。',
      '・連鎖すると得点が伸びます。',
    ],
  },
  {
    title: '遊び方 3/6：カノピックセット',
    lines: [
      '・肝臓・肺・胃・腸を2×2でそろえると成立。',
      '・並び順は自由です。',
      '・心臓は足りない臓器1種類の代わりになります。',
      '・心臓は1つまでです。',
      '・心臓が2つ以上ある2×2では成立しません。',
    ],
  },
  {
    title: '遊び方 4/6：脳・冥界深度',
    lines: [
      '・脳は障害ピースです。',
      '・脳は4つそろえても消えません。',
      '・カノピックセットには使えません。',
      '・ボムや一部の効果で消せます。',
      '・儀式を重ねると冥界深度が進みます。',
      '・深度はHUDで確認できます。',
    ],
  },
  {
    title: '遊び方 5/6：神々・ボム',
    lines: [
      '・棺メーターが進むと神が目覚めます。',
      '・目覚めた神はHUDに記録されます。',
      '・神はボムを授けます。',
      '・1〜4でボムを選択します。',
      '・同じ番号/Enter/Spaceで発動します。',
      '・Escで選択解除できます。',
    ],
  },
  {
    title: '遊び方 6/6：エンディング',
    lines: [
      '・アメンラー解放後、盤面を浄化するとTRUE END。',
      '・アメンラー解放後に力尽きるとNORMAL END。',
      '・復活した死者の数が演出に反映されます。',
    ],
  },
];


export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  preload() {
    preloadPieceAssets(this);
    preloadCoffinAssets(this);
    preloadBgmAssets(this);
  }

  create() {
    this.board = new Board();
    this.gravity = new GravitySystem(this.board);
    this.matchResolver = new MatchResolver(this.board);
    this.canopusResolver = new CanopusResolver(this.board);
    this.scoreSystem = new ScoreSystem();
    this.coffinMeter = new CoffinMeter();
    this.bombSystem = new BombSystem();
    this.highScoreManager = new HighScoreManager();
    this.highScoreRecords = this.highScoreManager.getRecords();
    this.sfx = new SoundManager();
    this.bgm = new BgmManager(this);
    this.score = INITIAL_SCORE;
    this.chainCount = 0;
    this.bestChainThisRun = 0;
    this.maxTierThisRun = 1;
    this.maxGodsUnlockedThisRun = 0;
    this.revivedSoulsCount = 0;
    this.awakenedGodIdsThisRun = new Set();
    this.totalPureCanopicCount = 0;
    this.currentDepthLevel = 1;
    this.level = INITIAL_LEVEL;
    this.activePiece = null;
    this.nextPairTypes = createRandomPairTypes();
    this.blockSprites = [];
    this.connectionSprites = [];
    this.connectionPulseTweens = [];
    this.fallTimer = 0;
    this.lockTimer = 0;
    this.gameState = GAME_STATES.TITLE;
    this.isGameOver = false;
    this.isDebugMode = false;
    this.layoutDebugText = null;
    this.feedbackTimer = null;
    this.chainPopupText = null;
    this.chainPopupTween = null;
    this.pureCanopicPopupText = null;
    this.pureCanopicPopupTween = null;
    this.depthTransitionText = null;
    this.depthTransitionTween = null;
    this.depthAtmosphere = null;
    this.depthPulseTween = null;
    this.pureCanopicPulseOverlay = null;
    this.pureCanopicRipple = null;
    this.pureCanopicPulseTween = null;
    this.pureCanopicRippleTween = null;
    this.bombAreaFlashSprites = [];
    this.bombAreaFlashTween = null;
    this.bombPreviewSprites = [];
    this.selectedBombSlot = null;
    this.clearHighlightSprites = [];
    this.clearHighlightTween = null;
    this.clearParticleSprites = [];
    this.clearParticleTweens = [];
    this.isResolvingClears = false;
    this.titleOverlay = null;
    this.titleAmbientTweens = [];
    this.titleGodNameEvent = null;
    this.titleGodNameText = null;
    this.howToPlayOverlay = null;
    this.howToPlayTitleText = null;
    this.howToPlayPageIndicatorText = null;
    this.howToPlayBodyText = null;
    this.howToPlayBodyVisibilityTestText = null;
    this.howToPlayFooterText = null;
    this.howToPlayPreviousButton = null;
    this.howToPlayNextButton = null;
    this.helpPageIndex = 0;
    this.isHowToPlayOpen = false;
    this.pauseOverlay = null;
    this.gameOverOverlay = null;
    this.gameOverAtmosphere = null;
    this.godAwakenOverlay = null;
    this.godAwakenHideTimer = null;
    this.godAwakenTween = null;
    this.godAwakenFlashTween = null;
    this.isDangerState = false;
    this.pendingBgmUpdateAfterResolution = false;
    this.lastBgmDebugState = null;
    this.currentEndingType = ENDING_TYPES.STANDARD_GAME_OVER;
    this.isTouchSoftDropping = false;
    this.touchActionHandler = null;

    this.layout = this.computeLayout();
    this.createBackground();
    this.createInput();
    this.hud = new Hud(this, this.layout.hudX, HUD_ORIGIN_Y, this.layout.hudWidth);
    this.hud.updateScore(this.score);
    this.hud.updateChain(this.chainCount);
    this.hud.updateBestScore(this.highScoreRecords.highScore);
    this.hud.updateLevel(this.level);
    this.hud.setDebugMode(this.isDebugMode);
    this.hud.updateCoffin(this.coffinMeter.getState());
    this.hud.updateBombStock(this.bombSystem.getStock(), this.selectedBombSlot);
    this.hud.drawNext(this.nextPairTypes);
    this.hud.updateSoundStatus(!this.sfx.isMuted);
    this.hud.updateRevivedSouls(this.revivedSoulsCount);
    this.hud.updateUnderworldDepth(this.currentDepthLevel, this.totalPureCanopicCount, DEPTH_PURE_CANOPIC_THRESHOLDS);
    this.refreshAwakenedGodPresence();
    this.createTitleOverlay();
    this.createLayoutDebugOverlay();
  }

  update(_, delta) {
    this.updateLayoutDebugOverlay();
    if (this.gameState !== GAME_STATES.PLAYING || this.isResolvingClears || !this.activePiece) {
      return;
    }

    const fallInterval = this.isSoftDropActive() ? SOFT_DROP_FALL_MS : NORMAL_FALL_MS;
    this.fallTimer += delta;

    if (this.fallTimer >= fallInterval) {
      this.fallTimer = 0;
      this.stepDown(delta);
    }

    if (!this.gravity.canFall(this.activePiece)) {
      this.lockTimer += delta;
      if (this.lockTimer >= LOCK_DELAY_MS) {
        this.lockActivePiece();
      }
    } else {
      this.lockTimer = 0;
    }
  }

  computeLayout() {
    const gameplayWidth = GAME_WIDTH - LAYOUT_CONFIG.sidePadding * 2 - LAYOUT_CONFIG.gap;
    const totalRatio = BOARD_AREA_RATIO + HUD_AREA_RATIO;
    const normalizedBoardRatio = totalRatio > 0 ? BOARD_AREA_RATIO / totalRatio : 0.63;
    const normalizedHudRatio = totalRatio > 0 ? HUD_AREA_RATIO / totalRatio : 0.37;
    const boardAreaWidth = Math.floor(gameplayWidth * normalizedBoardRatio);
    const maxBoardHeight = GAME_HEIGHT - (LAYOUT_CONFIG.boardTopPadding + LAYOUT_CONFIG.boardBottomPadding);
    const rawCellSize = Math.min(boardAreaWidth / BOARD_COLUMNS, maxBoardHeight / BOARD_ROWS);
    const ratioDrivenCellSize = Math.floor(rawCellSize);
    const cellSize = Math.min(ratioDrivenCellSize, LAYOUT_CONFIG.portraitMaxCellSize);
    const boardWidth = BOARD_COLUMNS * cellSize;
    const hudWidth = Math.max(0, gameplayWidth - boardWidth);
    const boardHeight = BOARD_ROWS * cellSize;
    const boardOriginX = LAYOUT_CONFIG.sidePadding;
    const boardOriginY = Math.floor((GAME_HEIGHT - boardHeight) / 2);
    const hudX = boardOriginX + boardWidth + LAYOUT_CONFIG.gap;
    console.log('[LayoutDebug]', {
      gameplayWidth,
      boardWidth,
      hudWidth,
      cellSize,
      boardRatio: BOARD_AREA_RATIO,
      hudRatio: HUD_AREA_RATIO,
    });

    return {
      cellSize,
      boardOriginX,
      boardOriginY,
      boardWidth,
      boardHeight,
      boardCenterX: boardOriginX + boardWidth / 2,
      boardCenterY: boardOriginY + boardHeight / 2,
      hudX,
      hudY: HUD_ORIGIN_Y,
      hudWidth,
      gameplayWidth,
      boardAreaWidth,
      layoutMode: totalRatio > 0 ? 'ratio' : 'fallback',
      normalizedBoardRatio,
      normalizedHudRatio,
    };
  }

  createLayoutDebugOverlay() {
    this.layoutDebugText = this.add.text(12, 12, '', {
      fontFamily: 'Consolas, Menlo, monospace',
      fontSize: '12px',
      color: '#f7e7a8',
      backgroundColor: '#140f08cc',
      padding: { x: 6, y: 4 },
      lineSpacing: 3,
    }).setDepth(200).setScrollFactor(0);

    this.updateLayoutDebugOverlay();
  }

  updateLayoutDebugOverlay() {
    if (!this.layoutDebugText) {
      return;
    }

    const shouldShow = (SHOW_LAYOUT_DEBUG_OVERLAY_IN_DEV || this.isDebugMode) && !this.isHowToPlayOpen;
    this.layoutDebugText.setVisible(shouldShow);

    if (!shouldShow) {
      return;
    }

    const ratio = this.layout.boardWidth > 0 ? this.layout.hudWidth / this.layout.boardWidth : 0;
    const lines = [
      `layout mode: ${this.layout.layoutMode}`,
      `game: ${GAME_WIDTH} x ${GAME_HEIGHT}`,
      `play area w: ${this.layout.gameplayWidth}`,
      `board area w: ${this.layout.boardAreaWidth}`,
      `hud w: ${this.layout.hudWidth}`,
      `board/hud ratio: ${ratio.toFixed(3)} (B:${this.layout.normalizedBoardRatio.toFixed(3)} H:${this.layout.normalizedHudRatio.toFixed(3)})`,
      `cell size: ${this.layout.cellSize}`,
      `board origin: (${this.layout.boardOriginX}, ${this.layout.boardOriginY})`,
      `hud origin: (${this.layout.hudX}, ${this.layout.hudY})`,
      `state: ${this.gameState}`,
    ];

    this.layoutDebugText.setText(lines.join('\n'));
  }

  getCellSize() { return this.layout.cellSize; }
  getBoardOriginX() { return this.layout.boardOriginX; }
  getBoardOriginY() { return this.layout.boardOriginY; }


  createBackground() {
    this.cameras.main.setBackgroundColor('#080704');

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x090705);
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH - 40, GAME_HEIGHT - 40, 0x17100a, 0.72)
      .setStrokeStyle(1, 0x6e5525, 0.32);

    const boardCenterX = this.layout.boardOriginX + (BOARD_COLUMNS * this.layout.cellSize) / 2;
    const boardCenterY = this.layout.boardOriginY + (BOARD_ROWS * this.layout.cellSize) / 2;
    const boardWidth = BOARD_COLUMNS * this.layout.cellSize;
    const boardHeight = BOARD_ROWS * this.layout.cellSize;
    const gameplayTop = 20;
    const gameplayBottom = GAME_HEIGHT - 20;
    const gameplayHeight = gameplayBottom - gameplayTop;
    const boardPanelCenterY = gameplayTop + (gameplayHeight / 2);

    this.add.rectangle(this.layout.boardOriginX + (boardWidth / 2), boardPanelCenterY, boardWidth + 40, gameplayHeight, 0x23180f, 0.84)
      .setStrokeStyle(2, 0x6e5525, 0.42);
    this.add.rectangle(this.layout.boardOriginX + (boardWidth / 2), boardPanelCenterY, boardWidth + 24, gameplayHeight - 14, 0x161009, 0.84)
      .setStrokeStyle(1, 0xd4af37, 0.22);

    this.boardOuterFrame = this.add.rectangle(boardCenterX, boardCenterY, boardWidth + 28, boardHeight + 28, 0x332313, 0.95)
      .setStrokeStyle(2, 0xd4af37, 0.82);
    this.boardInnerFrame = this.add.rectangle(boardCenterX, boardCenterY, boardWidth + 16, boardHeight + 16, 0x0c0a08, 0.98)
      .setStrokeStyle(1, 0xf0d27a, 0.35);
    this.add.rectangle(boardCenterX, boardCenterY, boardWidth, boardHeight, 0x12100d, 1);

    this.drawBoardCornerAccents(boardCenterX, boardCenterY, boardWidth, boardHeight);

    this.gridGraphics = this.add.graphics();
    this.gridGraphics.lineStyle(1, 0x8b7446, 0.2);

    for (let col = 0; col <= BOARD_COLUMNS; col += 1) {
      const x = this.layout.boardOriginX + col * this.layout.cellSize;
      this.gridGraphics.lineBetween(x, this.layout.boardOriginY, x, this.layout.boardOriginY + boardHeight);
    }

    for (let row = 0; row <= BOARD_ROWS; row += 1) {
      const y = this.layout.boardOriginY + row * this.layout.cellSize;
      this.gridGraphics.lineBetween(this.layout.boardOriginX, y, this.layout.boardOriginX + boardWidth, y);
    }

    this.boardFeedbackText = this.add.text(boardCenterX, this.layout.boardOriginY + 18, '', {
      fontFamily: 'Georgia, serif',
      fontSize: '24px',
      color: '#f4d77a',
      fontStyle: 'bold',
      align: 'center',
      stroke: '#1a1006',
      strokeThickness: 4,
    }).setOrigin(0.5, 0).setDepth(BOARD_FEEDBACK_DEPTH);
    this.chainPopupText = this.add.text(boardCenterX, this.layout.boardOriginY + CHAIN_POPUP_TOP_OFFSET, '', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '24px',
      color: '#f6d978',
      stroke: '#4f3b11',
      strokeThickness: 5,
      align: 'center',
      shadow: { offsetX: 0, offsetY: 0, color: '#f0c14f', blur: 14, fill: true },
    }).setOrigin(0.5, 0).setDepth(CHAIN_POPUP_DEPTH).setAlpha(0);
    this.pureCanopicPopupText = this.add.text(boardCenterX, this.layout.boardOriginY + 56, '', {
      fontFamily: 'Georgia, serif',
      fontSize: '20px',
      color: '#f2d088',
      stroke: '#4e3917',
      strokeThickness: 4,
      align: 'center',
      shadow: { offsetX: 0, offsetY: 0, color: '#f0c14f', blur: 10, fill: true },
    }).setOrigin(0.5, 0).setDepth(PURE_CANOPIC_POPUP_DEPTH).setAlpha(0);

    this.createGameOverAtmosphere();
    this.createRitualEndingAtmosphere();
    this.createDepthAtmosphere();
  }


  createRitualEndingAtmosphere() {
    this.endingHudDimmer = this.add.rectangle(
      this.layout.hudX + (this.layout.hudWidth / 2),
      GAME_HEIGHT / 2,
      this.layout.hudWidth + 12,
      GAME_HEIGHT - 24,
      0x0a0907,
      0,
    ).setDepth(20);

    this.endingBoardFade = this.add.rectangle(
      this.layout.boardOriginX + ((BOARD_COLUMNS * this.layout.cellSize) / 2),
      this.layout.boardOriginY + ((BOARD_ROWS * this.layout.cellSize) / 2),
      (BOARD_COLUMNS * this.layout.cellSize) + 16,
      (BOARD_ROWS * this.layout.cellSize) + 16,
      0x1c140d,
      0,
    ).setDepth(20);
  }

  resetRitualEndingAtmosphere() {
    this.endingHudDimmer?.setAlpha(0);
    this.endingBoardFade?.setAlpha(0);
  }

  createGameOverAtmosphere() {
    const boardCenterX = this.layout.boardOriginX + (BOARD_COLUMNS * this.layout.cellSize) / 2;
    const boardCenterY = this.layout.boardOriginY + (BOARD_ROWS * this.layout.cellSize) / 2;
    const boardWidth = BOARD_COLUMNS * this.layout.cellSize;
    const boardHeight = BOARD_ROWS * this.layout.cellSize;
    const shade = this.add.rectangle(boardCenterX, boardCenterY, boardWidth + 40, boardHeight + 40, 0x050301, 0)
      .setDepth(22);
    const sand = this.add.rectangle(boardCenterX, boardCenterY, boardWidth + 16, boardHeight + 16, 0x8a6738, 0)
      .setDepth(22);
    this.gameOverAtmosphere = { shade, sand };
  }

  createDepthAtmosphere() {
    const boardCenterX = this.layout.boardOriginX + (BOARD_COLUMNS * this.layout.cellSize) / 2;
    const boardCenterY = this.layout.boardOriginY + (BOARD_ROWS * this.layout.cellSize) / 2;
    const boardWidth = BOARD_COLUMNS * this.layout.cellSize;
    const boardHeight = BOARD_ROWS * this.layout.cellSize;

    const tint = this.add.rectangle(boardCenterX, boardCenterY, boardWidth + 36, boardHeight + 36, 0x1b140d, 0.08).setDepth(1.5);
    const fog = this.add.ellipse(boardCenterX, boardCenterY + 24, boardWidth + 18, boardHeight - 40, 0x6b5a3a, 0.03).setDepth(2);
    const glow = this.add.ellipse(boardCenterX, boardCenterY - 34, boardWidth * 0.68, boardHeight * 0.3, 0xd4af37, 0.04).setDepth(2);
    const pulseLines = this.add.graphics().setDepth(2.2);
    const corruption = this.add.ellipse(boardCenterX, boardCenterY + 34, boardWidth * 0.82, boardHeight * 0.54, 0x6f4f9e, 0).setDepth(2.05);
    const eyeGlow = this.add.ellipse(boardCenterX, boardCenterY - 2, boardWidth * 0.24, boardHeight * 0.08, 0xb5a7ff, 0).setDepth(2.25);
    const dustParticles = [];

    this.depthAtmosphere = { tint, fog, glow, pulseLines, corruption, eyeGlow, dustParticles };
    this.depthTransitionText = this.add.text(boardCenterX, this.layout.boardOriginY + 98, '', {
      fontFamily: 'Georgia, serif',
      fontSize: '17px',
      color: '#e5d0a0',
      letterSpacing: 3,
      stroke: '#120c05',
      strokeThickness: 3,
    }).setOrigin(0.5, 0.5).setDepth(DEPTH_TRANSITION_DEPTH).setAlpha(0);

    this.updateDepthAtmosphereVisuals(false);
  }

  updateDepthAtmosphereVisuals(animatePulse = true) {
    if (!this.depthAtmosphere) {
      return;
    }

    const profile = DEPTH_ATMOSPHERE_PROFILES[this.currentDepthLevel - 1] ?? DEPTH_ATMOSPHERE_PROFILES[0];
    const { tint, fog, glow, pulseLines, corruption, eyeGlow } = this.depthAtmosphere;

    tint.setFillStyle(profile.tintColor, profile.tintAlpha);
    fog.setFillStyle(profile.fogColor, profile.fogAlpha);
    fog.setAlpha(profile.fogAlpha);
    fog.setScale(profile.fogScale, profile.fogScale);
    glow.setFillStyle(profile.glowColor, profile.glowAlpha);
    glow.setAlpha(profile.glowAlpha);
    corruption.setAlpha(profile.corruptionAlpha);
    eyeGlow.setAlpha(profile.eyeGlowAlpha);
    this.redrawDepthPulseLines(profile.pulseAlpha, profile.pulseLineColor);
    this.rebuildDepthDust(profile);
    this.hud?.updateDepthAtmosphere(this.currentDepthLevel, profile);

    if (animatePulse) {
      if (this.depthPulseTween) {
        this.depthPulseTween.remove();
      }
      this.depthPulseTween = this.tweens.add({
        targets: [glow, fog, corruption, eyeGlow],
        alpha: (target, key, value) => value + profile.pulseStrength,
        duration: Math.floor(2400 / profile.ambientDrift),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      this.tweens.add({
        targets: pulseLines,
        alpha: { from: profile.pulseAlpha * 0.74, to: profile.pulseAlpha * 1.08 },
        duration: Math.floor(3000 / profile.ambientDrift),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  redrawDepthPulseLines(alpha, lineColor) {
    const pulseLines = this.depthAtmosphere?.pulseLines;
    if (!pulseLines) return;
    const boardWidth = BOARD_COLUMNS * this.layout.cellSize;
    const boardHeight = BOARD_ROWS * this.layout.cellSize;
    const centerX = this.layout.boardOriginX + boardWidth / 2;
    const centerY = this.layout.boardOriginY + boardHeight / 2;

    pulseLines.clear();
    pulseLines.lineStyle(1, lineColor, alpha);
    [-0.32, -0.11, 0.08, 0.29].forEach((offset) => {
      const y = centerY + (boardHeight * offset);
      pulseLines.beginPath();
      pulseLines.moveTo(centerX - boardWidth * 0.44, y);
      pulseLines.lineTo(centerX - boardWidth * 0.16, y - 4);
      pulseLines.lineTo(centerX + boardWidth * 0.15, y + 4);
      pulseLines.lineTo(centerX + boardWidth * 0.43, y);
      pulseLines.strokePath();
    });
  }

  rebuildDepthDust(profile) {
    const dustParticles = this.depthAtmosphere?.dustParticles ?? [];
    dustParticles.forEach((particle) => particle.destroy());
    this.depthAtmosphere.dustParticles = [];

    const boardWidth = BOARD_COLUMNS * this.layout.cellSize;
    const boardHeight = BOARD_ROWS * this.layout.cellSize;
    const minX = this.layout.boardOriginX + 8;
    const maxX = minX + boardWidth - 16;
    const minY = this.layout.boardOriginY + 8;
    const maxY = minY + boardHeight - 16;

    for (let index = 0; index < profile.dustCount; index += 1) {
      const particle = this.add.circle(
        Phaser.Math.Between(minX, maxX),
        Phaser.Math.Between(minY, maxY),
        Phaser.Math.FloatBetween(0.8, 1.7),
        0xd4af37,
        profile.dustAlpha,
      ).setDepth(2.1);
      this.depthAtmosphere.dustParticles.push(particle);

      this.tweens.add({
        targets: particle,
        x: Phaser.Math.Between(minX, maxX),
        y: Phaser.Math.Between(minY, maxY),
        alpha: Phaser.Math.FloatBetween(profile.dustAlpha * 0.4, profile.dustAlpha),
        duration: Phaser.Math.Between(profile.dustDriftMinMs, profile.dustDriftMaxMs),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  drawBoardCornerAccents(centerX, centerY, width, height) {
    const left = centerX - width / 2 - 18;
    const right = centerX + width / 2 + 18;
    const top = centerY - height / 2 - 18;
    const bottom = centerY + height / 2 + 18;
    const accentGraphics = this.add.graphics();

    accentGraphics.lineStyle(2, 0xf0d27a, 0.62);
    [
      [left, top, 28, 0, 0, 28],
      [right, top, -28, 0, 0, 28],
      [left, bottom, 28, 0, 0, -28],
      [right, bottom, -28, 0, 0, -28],
    ].forEach(([x, y, xLine, yLine, xDrop, yDrop]) => {
      accentGraphics.lineBetween(x, y, x + xLine, y + yLine);
      accentGraphics.lineBetween(x, y, x + xDrop, y + yDrop);
    });
  }

  createTitleOverlay() {
    this.titleOverlay = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2).setDepth(30);

    const panel = this.add.rectangle(0, 0, 600, 592, 0x100b06, 0.94)
      .setStrokeStyle(2, 0xd4af37, 0.85);
    const innerPanel = this.add.rectangle(0, 0, 560, 548, 0x1b1208, 0.72)
      .setStrokeStyle(1, 0xf0d27a, 0.34);
    const ambientGlow = this.add.ellipse(0, -130, 480, 268, 0xf4d77a, 0.06);
    const titleCoffin = this.add.rectangle(0, -220, 278, 108, 0x2a1b0f, 0.42)
      .setStrokeStyle(1, 0xf0d27a, 0.3);
    const title = this.add.text(0, -232, 'DUAT', {
      fontFamily: 'Georgia, serif',
      fontSize: '58px',
      color: '#d4af37',
      fontStyle: 'bold',
      align: 'center',
      stroke: '#050301',
      strokeThickness: 6,
    }).setOrigin(0.5).setAlpha(0);
    const subtitle = this.add.text(0, -184, '古代エジプト落ち物パズル', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '22px',
      color: '#f4d77a',
      align: 'center',
    }).setOrigin(0.5).setAlpha(0);
    const description = this.add.text(0, -142, '臓器を集め、カノプスセットを完成させ、神々を目覚めさせよう。', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '17px',
      color: '#eadfca',
      align: 'center',
      lineSpacing: 4,
      wordWrap: { width: 500 },
    }).setOrigin(0.5);
    const bestRecords = this.createBestRecordsText();
    const bestText = this.add.text(0, -82, bestRecords, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      color: '#f4d77a',
      align: 'center',
      lineSpacing: 2,
    }).setOrigin(0.5);
    const controls = this.add.text(0, 44, [
      '← / →：移動',
      '↓：ソフトドロップ',
      '↑ / Z：回転',
      'Space：ハードドロップ',
      'Enter：ポーズ',
      '1〜4：ボム',
      'Esc：取消',
      'M：ミュート',
    ], {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      color: '#d9c8a8',
      align: 'center',
      lineSpacing: 3,
    }).setOrigin(0.5);
    const keyboardPrompt = this.add.text(0, 156, 'PRESS START / Enter / Space　H：遊び方', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '17px',
      color: '#d4af37',
      fontStyle: 'bold',
      align: 'center',
    }).setOrigin(0.5);
    const startButton = this.createTitleButton(-128, 214, 240, 72, 'ゲーム開始');
    const howToButton = this.createTitleButton(128, 214, 240, 72, '遊び方');
    const tapHint = this.add.text(0, 268, 'タップでも開始できます', {
      fontFamily: 'Georgia, serif',
      fontSize: '15px',
      color: '#bcae90',
      align: 'center',
    }).setOrigin(0.5);
    const versionTextBackground = this.add.rectangle(-272, 188, 248, 106, 0x070401, 0.88)
      .setOrigin(0, 1)
      .setStrokeStyle(2, 0xd4af37, 0.86);
    const versionText = this.add.text(-260, 178, `DEV BUILD
v${GAME_VERSION}
Build ${BUILD_LABEL}
${COMMIT_SHA}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '15px',
      color: '#f8e9c4',
      align: 'left',
      fontStyle: 'bold',
      lineSpacing: 4,
    }).setOrigin(0, 1);

    const dustParticles = [];
    for (let i = 0; i < TITLE_DUST_PARTICLE_COUNT; i += 1) {
      const dust = this.add.circle(
        Phaser.Math.Between(-258, 258),
        Phaser.Math.Between(-250, 246),
        Phaser.Math.Between(1, 3),
        0xd4af37,
        Phaser.Math.FloatBetween(0.05, 0.12),
      );
      dustParticles.push(dust);
    }

    this.titleGodNameText = this.add.text(0, -20, '', {
      fontFamily: 'Georgia, serif',
      fontSize: '24px',
      color: '#f4d77a',
      align: 'center',
      letterSpacing: 5,
    }).setOrigin(0.5).setAlpha(0.0);

    this.titleOverlay.add([
      panel,
      innerPanel,
      ambientGlow,
      ...dustParticles,
      titleCoffin,
      title,
      subtitle,
      this.titleGodNameText,
      description,
      bestText,
      controls,
      keyboardPrompt,
      startButton.container,
      howToButton.container,
      tapHint,
      versionTextBackground,
      versionText,
    ]);

    this.setupTitleAmbientMotion({ title, subtitle, keyboardPrompt, ambientGlow, titleCoffin, dustParticles });

    panel.setInteractive({ useHandCursor: true });
    panel.on('pointerdown', () => {
      if (!this.isHowToPlayOpen) {
        this.startGame();
      }
    });
    startButton.background.on('pointerdown', () => this.startGame());
    startButton.text.on('pointerdown', () => this.startGame());
    howToButton.background.on('pointerdown', () => this.openHowToPlay());
    howToButton.text.on('pointerdown', () => this.openHowToPlay());
    this.createHowToPlayOverlay();
  }

  setupTitleAmbientMotion({ title, subtitle, keyboardPrompt, ambientGlow, titleCoffin, dustParticles }) {
    const titleSteps = ['D', 'DU', 'DUA', 'DUAT'];
    titleSteps.forEach((text, index) => {
      this.time.delayedCall(index * TITLE_LOGO_STEP_MS, () => {
        if (this.gameState !== GAME_STATES.TITLE || !title.active) {
          return;
        }
        title.setText(text);
      });
    });

    this.titleAmbientTweens.push(
      this.tweens.add({ targets: title, alpha: 1, duration: TITLE_LOGO_FADE_MS, ease: 'Sine.Out' }),
      this.tweens.add({ targets: subtitle, alpha: 1, delay: 420, duration: 1200, ease: 'Sine.Out' }),
      this.tweens.add({
        targets: titleCoffin,
        scaleX: TITLE_COFFIN_PULSE_SCALE,
        scaleY: TITLE_COFFIN_PULSE_SCALE,
        duration: TITLE_COFFIN_PULSE_MS,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      }),
      this.tweens.add({
        targets: keyboardPrompt,
        alpha: { from: 0.56, to: 0.95 },
        duration: TITLE_PROMPT_PULSE_MS,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      }),
      this.tweens.add({
        targets: ambientGlow,
        alpha: { from: 0.04, to: 0.1 },
        duration: TITLE_AMBIENT_SHIMMER_MS,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      }),
    );

    dustParticles.forEach((dust) => {
      const tween = this.tweens.add({
        targets: dust,
        x: dust.x + Phaser.Math.Between(-38, 38),
        y: dust.y + Phaser.Math.Between(-18, 18),
        alpha: { from: dust.alpha * 0.7, to: dust.alpha * 1.1 },
        duration: Phaser.Math.Between(TITLE_DUST_DRIFT_MIN_MS, TITLE_DUST_DRIFT_MAX_MS),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      });
      this.titleAmbientTweens.push(tween);
    });

    this.scheduleNextTitleGodName();
  }

  scheduleNextTitleGodName() {
    if (!this.titleGodNameText || this.gameState !== GAME_STATES.TITLE) {
      return;
    }

    const names = ['IMSETY', 'HAPI', 'DUAMUTEF', 'QEBEHSENUEF'];
    const wait = Phaser.Math.Between(TITLE_GOD_NAME_INTERVAL_MIN_MS, TITLE_GOD_NAME_INTERVAL_MAX_MS);
    this.titleGodNameEvent = this.time.delayedCall(wait, () => {
      if (!this.titleGodNameText || this.gameState !== GAME_STATES.TITLE) {
        return;
      }
      this.titleGodNameText.setText(Phaser.Utils.Array.GetRandom(names));
      this.tweens.add({
        targets: this.titleGodNameText,
        alpha: { from: 0, to: 0.14 },
        duration: 1800,
        yoyo: true,
        ease: 'Sine.InOut',
        onComplete: () => {
          if (this.titleGodNameText) {
            this.titleGodNameText.setAlpha(0);
          }
          this.scheduleNextTitleGodName();
        },
      });
    });
  }

  createTitleButton(x, y, width, height, label) {
    const container = this.add.container(x, y);
    const background = this.add.rectangle(0, 0, width, height, 0x2b1c0d, 0.98)
      .setStrokeStyle(2, 0xd4af37, 0.94)
      .setInteractive({ useHandCursor: true });
    const highlight = this.add.rectangle(0, -height * 0.18, width - 12, Math.max(10, height * 0.24), 0xf4d77a, 0.12);
    const text = this.add.text(0, 0, label, {
      fontFamily: 'Arial, sans-serif',
      fontSize: label === 'ゲーム開始' ? '33px' : '28px',
      color: '#f4d77a',
      fontStyle: 'bold',
      align: 'center',
    }).setOrigin(0.5);

    text.setInteractive({ useHandCursor: true });
    container.add([background, highlight, text]);
    return { container, background, text };
  }

  createHowToPlayOverlay() {
    this.howToPlayOverlay = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2)
      .setDepth(45)
      .setVisible(false);

    const shade = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x050301, 0.78);
    this.howToPlayPanel = this.add.rectangle(0, 0, 700, 560, 0x100b06, 0.98)
      .setStrokeStyle(2, 0xd4af37, 0.88);
    this.howToPlayInnerPanel = this.add.rectangle(0, 0, 660, 518, 0x1b1208, 0.82)
      .setStrokeStyle(1, 0xf0d27a, 0.36);

    this.howToPlayTitleText = this.add.text(0, -244, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '25px',
      color: '#d4af37',
      fontStyle: 'bold',
      align: 'center',
      stroke: '#050301',
      strokeThickness: 4,
      wordWrap: { width: 620 },
    }).setOrigin(0.5);

    this.howToPlayPageIndicatorText = this.add.text(0, -212, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      color: '#bcae90',
      align: 'center',
    }).setOrigin(0.5);

    this.howToPlayBodyViewportTop = -188;
    this.howToPlayBodyViewportHeight = 332;
    this.howToPlayBodyText = this.add.text(-300, this.howToPlayBodyViewportTop, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: '#eadfca',
      lineSpacing: 7,
      wordWrap: { width: 600 },
    }).setOrigin(0, 0);
    this.howToPlayBodyText.setAlpha(1);
    this.howToPlayBodyText.setDepth(2);

    this.howToPlayBodyVisibilityTestText = this.add.text(-300, this.howToPlayBodyViewportTop + 120, 'TEST HELP BODY VISIBLE', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      color: '#f4ead2',
      fontStyle: 'bold',
    }).setOrigin(0, 0).setAlpha(1).setDepth(3);

    this.howToPlayFooterText = this.add.text(0, 188, '←/→・A/D：ページ移動　Enter / Space：次へ　Esc：閉じる', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      color: '#bcae90',
      align: 'center',
      wordWrap: { width: 610 },
    }).setOrigin(0.5);

    this.howToPlayPreviousButton = this.createHowToPlayButton(-170, 236, 120, '前へ', () => this.showPreviousHelpPage());
    this.howToPlayNextButton = this.createHowToPlayButton(0, 236, 120, '次へ', () => this.showNextHelpPage());
    this.howToPlayCloseButton = this.createHowToPlayButton(170, 236, 120, '閉じる', () => this.closeHowToPlay());

    this.layoutHowToPlayOverlay();

    this.howToPlayOverlay.add([
      shade,
      this.howToPlayPanel,
      this.howToPlayInnerPanel,
      this.howToPlayTitleText,
      this.howToPlayPageIndicatorText,
      this.howToPlayBodyText,
      this.howToPlayBodyVisibilityTestText,
      this.howToPlayFooterText,
      this.howToPlayPreviousButton.container,
      this.howToPlayNextButton.container,
      this.howToPlayCloseButton.container,
    ]);
    shade.setInteractive();
    this.howToPlayPanel.setInteractive();
    this.updateHowToPlayPage();
  }

  createHowToPlayButton(x, y, width, label, onPointerDown) {
    const container = this.add.container(x, y);
    const background = this.add.rectangle(0, 0, width, 38, 0x332313, 0.98)
      .setStrokeStyle(2, 0xd4af37, 0.82)
      .setInteractive({ useHandCursor: true });
    const text = this.add.text(0, 0, label, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: '#f4d77a',
      fontStyle: 'bold',
      align: 'center',
    }).setOrigin(0.5);

    background.on('pointerdown', onPointerDown);
    text.setInteractive({ useHandCursor: true });
    text.on('pointerdown', onPointerDown);
    container.add([background, text]);

    return { container, background, text };
  }


  layoutHowToPlayOverlay() {
    if (!this.howToPlayPanel) {
      return;
    }
    const canvas = this.sys?.game?.canvas;
    const viewportWidth = canvas?.clientWidth ?? GAME_WIDTH;
    const viewportHeight = canvas?.clientHeight ?? GAME_HEIGHT;
    const isMobilePortrait = viewportWidth <= 520 && viewportHeight > viewportWidth;
    this.isHowToPlayMobilePortrait = isMobilePortrait;
    const panelWidth = isMobilePortrait ? 620 : 700;
    const panelHeight = isMobilePortrait ? 540 : 560;
    const horizontalPadding = isMobilePortrait ? 38 : 30;
    const contentWidth = panelWidth - (horizontalPadding * 2);

    this.howToPlayPanel.setSize(panelWidth, panelHeight);
    this.howToPlayInnerPanel.setSize(panelWidth - 40, panelHeight - 42);

    this.howToPlayTitleText.setPosition(0, -panelHeight / 2 + 38);
    this.howToPlayTitleText.setWordWrapWidth(contentWidth);
    this.howToPlayTitleText.setFontSize(isMobilePortrait ? '22px' : '25px');

    this.howToPlayPageIndicatorText.setPosition(0, -panelHeight / 2 + 74);

    const pageIndicatorBottom = this.howToPlayPageIndicatorText.y + (this.howToPlayPageIndicatorText.height / 2);
    const titleAreaBottom = pageIndicatorBottom;
    const footerY = panelHeight / 2 - 84;
    const buttonY = panelHeight / 2 - 42;
    const footerHeight = this.howToPlayFooterText.height || 18;
    const bodyTopMargin = 12;
    const bodyBottomMargin = isMobilePortrait ? 18 : 14;
    const bodyBottom = Math.min(footerY - bodyBottomMargin, buttonY - footerHeight - bodyBottomMargin);

    this.howToPlayBodyViewportTop = titleAreaBottom + bodyTopMargin;
    const computedBodyHeight = bodyBottom - this.howToPlayBodyViewportTop;
    if (computedBodyHeight <= 0) {
      console.warn('[HelpLayout] Invalid body height detected. Falling back to safe height.', {
        computedBodyHeight,
        bodyBottom,
        bodyTop: this.howToPlayBodyViewportTop,
        panelWidth,
        panelHeight,
      });
    }
    this.howToPlayBodyViewportHeight = Math.max(32, computedBodyHeight);
    this.howToPlayBodyText.setPosition(-panelWidth / 2 + horizontalPadding, this.howToPlayBodyViewportTop);
    this.howToPlayBodyText.setWordWrapWidth(contentWidth);
    this.howToPlayBodyText.setFontSize(isMobilePortrait ? '15px' : '16px');
    this.howToPlayBodyText.setLineSpacing(isMobilePortrait ? 10 : 7);
    this.howToPlayBodyText.setColor('#eadfca');
    this.howToPlayBodyText.setAlpha(1);

    this.howToPlayBodyVisibilityTestText?.setPosition(-panelWidth / 2 + 40, -panelHeight / 2 + 180);
    this.howToPlayBodyVisibilityTestText?.setDepth(3);
    this.howToPlayBodyVisibilityTestText?.setAlpha(1);

    this.howToPlayFooterText.setPosition(0, panelHeight / 2 - 84);
    this.howToPlayFooterText.setWordWrapWidth(contentWidth);
    this.howToPlayFooterText.setFontSize(isMobilePortrait ? '13px' : '14px');

    this.howToPlayPreviousButton.container.setPosition(-panelWidth * 0.24, buttonY);
    this.howToPlayNextButton.container.setPosition(0, buttonY);
    this.howToPlayCloseButton?.container.setPosition(panelWidth * 0.24, buttonY);

    this.howToPlayBodyText.setDepth(2);
    this.howToPlayFooterText.setDepth(3);
    this.howToPlayPreviousButton.container.setDepth(4);
    this.howToPlayNextButton.container.setDepth(4);
    this.howToPlayCloseButton?.container.setDepth(4);

    this.resetHowToPlayBodyScroll();
  }

  resetHowToPlayBodyScroll() {
    if (!this.howToPlayBodyText) {
      return;
    }
    this.howToPlayBodyText.y = this.howToPlayBodyViewportTop;
  }
  updateHowToPlayPage() {
    const page = HOW_TO_PLAY_PAGES[this.helpPageIndex];
    const lines = Array.isArray(page.lines) ? page.lines : [];
    const bodyText = lines.join('\n');
    this.howToPlayTitleText?.setText(page.title);
    this.howToPlayPageIndicatorText?.setText(`遊び方 ${this.helpPageIndex + 1} / ${HOW_TO_PLAY_PAGES.length}`);
    this.howToPlayBodyText?.setText(bodyText);
    this.fitHowToPlayBodyToViewport();
    this.resetHowToPlayBodyScroll();
    this.updateHowToPlayButtonState(this.howToPlayPreviousButton, this.helpPageIndex > 0);
    this.updateHowToPlayButtonState(this.howToPlayNextButton, this.helpPageIndex < HOW_TO_PLAY_PAGES.length - 1);
    console.debug('[HelpPage]', {
      pageIndex: this.helpPageIndex,
      title: page.title,
      helpPagesLength: HOW_TO_PLAY_PAGES.length,
      bodyFieldName: 'lines',
      bodyLineCount: lines.length,
      firstBodyLine: lines[0] ?? '',
      bodyArea: {
        x: this.howToPlayBodyText?.x ?? 0,
        y: this.howToPlayBodyViewportTop,
        width: this.howToPlayBodyText?.style.wordWrapWidth ?? 0,
        height: this.howToPlayBodyViewportHeight,
      },
    });
  }

  fitHowToPlayBodyToViewport() {
    if (!this.howToPlayBodyText) {
      return;
    }

    const baseFontSize = this.isHowToPlayMobilePortrait ? 15 : 16;
    const minFontSize = 13;
    const baseLineSpacing = this.isHowToPlayMobilePortrait ? 10 : 7;
    const minLineSpacing = 4;

    let fontSize = baseFontSize;
    let lineSpacing = baseLineSpacing;
    this.howToPlayBodyText.setFontSize(`${fontSize}px`);
    this.howToPlayBodyText.setLineSpacing(lineSpacing);

    while (this.howToPlayBodyText.height > this.howToPlayBodyViewportHeight && fontSize > minFontSize) {
      fontSize -= 1;
      lineSpacing = Math.max(minLineSpacing, lineSpacing - 1);
      this.howToPlayBodyText.setFontSize(`${fontSize}px`);
      this.howToPlayBodyText.setLineSpacing(lineSpacing);
    }
  }

  updateHowToPlayButtonState(button, isEnabled) {
    if (!button) {
      return;
    }

    button.background.disableInteractive();
    button.text.disableInteractive();
    button.container.setAlpha(isEnabled ? 1 : 0.38);

    if (isEnabled) {
      button.background.setInteractive({ useHandCursor: true });
      button.text.setInteractive({ useHandCursor: true });
    }
  }

  showPreviousHelpPage() {
    if (!this.isHowToPlayOpen || this.helpPageIndex <= 0) {
      return;
    }

    this.helpPageIndex -= 1;
    this.updateHowToPlayPage();
  }

  showNextHelpPage() {
    if (!this.isHowToPlayOpen) {
      return;
    }

    if (this.helpPageIndex >= HOW_TO_PLAY_PAGES.length - 1) {
      return;
    }

    this.helpPageIndex += 1;
    this.updateHowToPlayPage();
  }

  openHowToPlay() {
    if (this.gameState !== GAME_STATES.TITLE || this.isHowToPlayOpen) {
      return;
    }

    this.sfx.resume();
    this.helpPageIndex = 0;
    this.updateHowToPlayPage();
    this.isHowToPlayOpen = true;
    this.layoutHowToPlayOverlay();
    this.howToPlayOverlay?.setVisible(true);
    this.updateLayoutDebugOverlay();
  }

  closeHowToPlay() {
    if (!this.isHowToPlayOpen) {
      return;
    }

    this.isHowToPlayOpen = false;
    this.howToPlayOverlay?.setVisible(false);
    this.updateLayoutDebugOverlay();
  }

  createBestRecordsText() {
    const records = this.highScoreRecords ?? this.highScoreManager?.getRecords();

    return [
      `ベストスコア: ${records.highScore}`,
      `最大連鎖: ${records.maxChain}`,
      `最大Tier: ${records.maxTier}`,
      `解放神: ${records.maxGodsUnlocked}/${TOTAL_GOD_COUNT}`,
    ].join('\n');
  }

  createPauseOverlay() {
    this.pauseOverlay = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2).setDepth(35).setVisible(false);
    const shade = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x050301, 0.62);
    const panel = this.add.rectangle(0, 0, 330, 180, 0x100b06, 0.94)
      .setStrokeStyle(2, 0xd4af37, 0.82);
    const title = this.add.text(0, -32, 'ポーズ中', {
      fontFamily: 'Georgia, serif',
      fontSize: '38px',
      color: '#d4af37',
      fontStyle: 'bold',
      align: 'center',
    }).setOrigin(0.5);
    const prompt = this.add.text(0, 34, 'Enter / Space で再開', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      color: '#eadfca',
      align: 'center',
    }).setOrigin(0.5);

    this.pauseOverlay.add([shade, panel, title, prompt]);
    shade.setInteractive({ useHandCursor: true });
    panel.setInteractive({ useHandCursor: true });
    prompt.setInteractive({ useHandCursor: true });
    [shade, panel, prompt].forEach((target) => {
      target.on('pointerdown', () => this.resumeGame());
    });
  }

  startGame() {
    if (this.gameState !== GAME_STATES.TITLE || this.isHowToPlayOpen) {
      return;
    }

    this.sfx.resume();
    this.resetGameState();
    this.gameState = GAME_STATES.PLAYING;
    this.titleOverlay?.setVisible(false);
    this.closeHowToPlay();
    this.pauseOverlay?.setVisible(false);
    this.safeUpdateBgmForGameState();
    this.spawnPiece();
  }

  restartGame() {
    if (this.gameState !== GAME_STATES.GAME_OVER) {
      return;
    }

    this.sfx.resume();
    this.resetGameState();
    this.gameState = GAME_STATES.PLAYING;
    this.safeUpdateBgmForGameState();
    this.spawnPiece();
  }

  resetGameState() {
    this.board.reset();
    this.scoreSystem = new ScoreSystem();
    this.coffinMeter.reset();
    this.bombSystem.reset();
    this.score = INITIAL_SCORE;
    this.chainCount = 0;
    this.bestChainThisRun = 0;
    this.maxTierThisRun = 1;
    this.maxGodsUnlockedThisRun = 0;
    this.level = INITIAL_LEVEL;
    this.revivedSoulsCount = 0;
    this.awakenedGodIdsThisRun = new Set();
    this.totalPureCanopicCount = 0;
    this.currentDepthLevel = 1;
    this.activePiece = null;
    this.nextPairTypes = createRandomPairTypes();
    this.fallTimer = 0;
    this.lockTimer = 0;
    this.isGameOver = false;
    this.isDebugMode = false;
    this.layoutDebugText = null;
    this.isResolvingClears = false;
    this.isTouchSoftDropping = false;
    this.isDangerState = false;
    this.pendingBgmUpdateAfterResolution = false;
    this.lastBgmDebugState = null;
    this.currentEndingType = ENDING_TYPES.STANDARD_GAME_OVER;
    this.bgm.stop();
    this.clearTransientVisuals();
    this.resetGameOverAtmosphere();
    this.resetRitualEndingAtmosphere();
    this.updateHudForReset();
    this.renderBoard();
  }

  clearTransientVisuals() {
    this.cancelBombSelection();
    this.clearBombAreaFlash();
    this.clearClearHighlights();
    this.clearClearParticles();
    this.boardFeedbackText.setText('');
    this.clearChainPopup();
    this.clearPureCanopicPopup();
    this.clearPureCanopicPulse();

    if (this.feedbackTimer) {
      this.feedbackTimer.remove(false);
      this.feedbackTimer = null;
    }

    if (this.gameOverOverlay) {
      this.gameOverOverlay.destroy(true);
      this.gameOverOverlay = null;
    }
  }

  updateHudForReset() {
    this.hud.updateScore(this.score);
    this.hud.updateChain(this.chainCount);
    this.hud.updateBestScore(this.highScoreRecords.highScore);
    this.hud.updateLevel(this.level);
    this.hud.setDebugMode(this.isDebugMode);
    this.hud.updateCoffin(this.coffinMeter.getState());
    this.hud.updateBombStock(this.bombSystem.getStock(), this.selectedBombSlot);
    this.hud.drawNext(this.nextPairTypes);
    this.hud.clearFeedback();
    this.hud.showReadyStatus();
    this.hud.updateSoundStatus(!this.sfx.isMuted);
    this.hud.updateRevivedSouls(this.revivedSoulsCount);
    this.hud.updateUnderworldDepth(this.currentDepthLevel, this.totalPureCanopicCount, DEPTH_PURE_CANOPIC_THRESHOLDS);
    this.refreshAwakenedGodPresence();
  }

  pauseGame() {
    if (this.gameState !== GAME_STATES.PLAYING || this.isResolvingClears) {
      return;
    }

    this.gameState = GAME_STATES.PAUSED;
    this.sfx.playPause();
    this.cancelBombSelection();
    this.pauseOverlay?.setVisible(true);
    this.bgm.pause();
  }

  resumeGame() {
    if (this.gameState !== GAME_STATES.PAUSED) {
      return;
    }

    this.gameState = GAME_STATES.PLAYING;
    this.sfx.playPause();
    this.sfx.resume();
    this.pauseOverlay?.setVisible(false);
    this.bgm.resume();
    this.safeUpdateBgmForGameState();
  }

  handlePauseKey() {
    if (this.gameState === GAME_STATES.PLAYING) {
      this.pauseGame();
      return;
    }

    if (this.gameState === GAME_STATES.PAUSED) {
      this.resumeGame();
    }
  }

  createInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyZ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyG = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.G);
    this.keyT = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.T);
    this.keyR = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.keyN = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.N);
    this.keyP = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
    this.keyM = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);
    this.keyH = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.H);
    this.keyEnter = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.keyEsc = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.bombKeys = [
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE),
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO),
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE),
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FOUR),
    ];

    this.input.keyboard.on('keydown', () => this.sfx.resume());
    this.cursors.left.on('down', () => this.handleLeftKey());
    this.cursors.right.on('down', () => this.handleRightKey());
    this.cursors.up.on('down', () => this.tryRotate());
    this.keyZ.on('down', () => this.tryRotate());
    this.cursors.space.on('down', () => this.handleSpaceKey());
    this.keyA.on('down', () => this.handleLeftKey());
    this.keyD.on('down', () => this.handleRightOrDebugKey());
    this.keyG.on('down', (key, event) => this.handleDebugMeterKey(event));
    this.keyT.on('down', (key, event) => this.handleDebugTKey(event));
    this.keyR.on('down', (key, event) => this.handleRestartOrDebugReset(event));
    this.keyE.on('down', (key, event) => this.handleDebugEndingShortcut(event));
    this.keyN.on('down', (key, event) => this.handleDebugEndingShortcut(event));
    this.keyP.on('down', () => this.handlePauseKey());
    this.keyM.on('down', () => this.toggleMute());
    this.keyH.on('down', () => this.handleHowToPlayKey());
    this.keyEnter.on('down', () => this.handleEnterKey());
    this.keyEsc.on('down', () => this.handleEscKey());
    this.bombKeys.forEach((key, index) => {
      key.on('down', () => this.selectBombSlot(index));
    });

    this.registerTouchControls();
    this.createPauseOverlay();
  }

  registerTouchControls() {
    this.touchActionHandler = (event) => this.handleTouchAction(event.detail);
    window.addEventListener('duat-touch-action', this.touchActionHandler);
    this.emitTouchControlState();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (this.touchActionHandler) {
        window.removeEventListener('duat-touch-action', this.touchActionHandler);
        this.touchActionHandler = null;
      }
      window.dispatchEvent(new CustomEvent('duat-touch-state', { detail: { hasBombSelected: false } }));
    });
  }

  emitTouchControlState() {
    window.dispatchEvent(new CustomEvent('duat-touch-state', {
      detail: { hasBombSelected: this.selectedBombSlot !== null },
    }));
  }

  handleTouchAction(detail = {}) {
    this.sfx.resume();

    const { action, phase = 'tap' } = detail;

    if (action === 'start') {
      this.startGame();
      return;
    }

    if (action === 'pause') {
      this.handlePauseKey();
      return;
    }

    if (action === 'cancel') {
      this.handleEscKey();
      return;
    }

    if (action === 'down') {
      this.handleTouchDownButton(phase);
      return;
    }

    if (phase === 'up') {
      return;
    }

    if (action === 'left') {
      this.handleLeftKey();
      return;
    }

    if (action === 'right') {
      this.handleRightKey();
      return;
    }

    if (action === 'rotate') {
      this.tryRotate();
      return;
    }

    if (action === 'drop') {
      this.handleTouchDropButton();
      return;
    }

    if (action?.startsWith('bomb-')) {
      const slotIndex = Number.parseInt(action.slice(5), 10);
      if (Number.isInteger(slotIndex)) {
        this.selectBombSlot(slotIndex);
      }
    }
  }

  handleTouchDropButton() {
    if (this.gameState !== GAME_STATES.PLAYING || this.isResolvingClears || !this.activePiece) {
      return;
    }

    if (this.selectedBombSlot !== null) {
      this.confirmSelectedBomb();
      return;
    }

    this.hardDrop();
  }

  handleTouchDownButton(phase) {
    if (phase === 'up') {
      this.isTouchSoftDropping = false;
      return;
    }

    if (phase === 'down') {
      if (this.gameState !== GAME_STATES.PLAYING || this.isResolvingClears || !this.activePiece) {
        this.isTouchSoftDropping = false;
        return;
      }

      this.isTouchSoftDropping = true;
      this.stepDown(SOFT_DROP_FALL_MS);
    }
  }

  isSoftDropActive() {
    return this.cursors.down.isDown || this.isTouchSoftDropping;
  }

  handleLeftKey() {
    if (this.isHowToPlayOpen) {
      this.showPreviousHelpPage();
      return;
    }

    this.tryMoveSideways(-1);
  }

  handleRightKey() {
    if (this.isHowToPlayOpen) {
      this.showNextHelpPage();
      return;
    }

    this.tryMoveSideways(1);
  }

  handleRightOrDebugKey() {
    if (this.isHowToPlayOpen) {
      this.showNextHelpPage();
      return;
    }

    this.toggleDebugMode();
  }

  handleHowToPlayKey() {
    if (this.gameState === GAME_STATES.TITLE) {
      this.openHowToPlay();
    }
  }

  handleEnterKey() {
    if (this.isHowToPlayOpen) {
      this.showNextHelpPage();
      return;
    }

    if (this.gameState === GAME_STATES.TITLE) {
      this.startGame();
      return;
    }

    if (this.gameState === GAME_STATES.GAME_OVER) {
      this.restartGame();
      return;
    }

    if (this.gameState === GAME_STATES.PAUSED) {
      this.resumeGame();
      return;
    }

    if (this.gameState === GAME_STATES.PLAYING) {
      if (this.selectedBombSlot !== null) {
        this.confirmSelectedBomb();
        return;
      }

      this.pauseGame();
    }
  }

  handleEscKey() {
    if (this.isHowToPlayOpen) {
      this.closeHowToPlay();
      return;
    }

    if (this.gameState === GAME_STATES.PAUSED) {
      this.resumeGame();
      return;
    }

    if (this.gameState === GAME_STATES.PLAYING) {
      this.cancelBombSelection();
    }
  }

  handleRestartOrDebugReset(event) {
    if (this.gameState === GAME_STATES.GAME_OVER) {
      this.restartGame();
      return;
    }

    if (this.gameState === GAME_STATES.PLAYING) {
      if (event?.shiftKey) {
        this.addDebugRevivedSouls(5);
        return;
      }
      this.resetDebugProgression();
    }
  }

  spawnPiece() {
    const spawnCol = Math.floor(BOARD_COLUMNS / 2);
    const spawnRow = 0;

    this.activePiece = new Piece(this.nextPairTypes, spawnCol, spawnRow);
    this.nextPairTypes = createRandomPairTypes();
    this.hud.drawNext(this.nextPairTypes);

    if (!this.board.canPlace(this.activePiece)) {
      this.endGame(ENDING_TYPES.STANDARD_GAME_OVER);
      return;
    }

    this.fallTimer = 0;
    this.lockTimer = 0;
    this.renderBoard();
  }

  tryMoveSideways(deltaCol) {
    if (this.tryMove(deltaCol, 0)) {
      this.sfx.playMove();
    }
  }

  tryMove(deltaCol, deltaRow) {
    if (this.gameState !== GAME_STATES.PLAYING || this.isResolvingClears || !this.activePiece) {
      return false;
    }

    const movedPiece = this.activePiece.moved(deltaCol, deltaRow);
    if (!this.board.canPlace(movedPiece)) {
      return false;
    }

    this.activePiece = movedPiece;
    this.lockTimer = 0;
    this.renderBoard();
    this.updateBombPreview();
    return true;
  }

  tryRotate() {
    if (this.gameState !== GAME_STATES.PLAYING || this.isResolvingClears || !this.activePiece) {
      return;
    }

    const rotatedPiece = this.activePiece.rotated();
    if (this.board.canPlace(rotatedPiece)) {
      this.activePiece = rotatedPiece;
      this.lockTimer = 0;
      this.renderBoard();
      this.updateBombPreview();
      this.sfx.playRotate();
      return true;
    }

    return false;
  }

  stepDown(delta) {
    if (this.tryMove(0, 1)) {
      if (this.isSoftDropActive()) {
        this.sfx.playSoftDrop();
      }
      return;
    }

    this.lockTimer += delta;
  }

  handleSpaceKey() {
    if (this.isHowToPlayOpen) {
      this.showNextHelpPage();
      return;
    }

    if (this.gameState === GAME_STATES.TITLE) {
      this.startGame();
      return;
    }

    if (this.gameState === GAME_STATES.GAME_OVER) {
      this.restartGame();
      return;
    }

    if (this.gameState === GAME_STATES.PAUSED) {
      this.resumeGame();
      return;
    }

    if (this.gameState !== GAME_STATES.PLAYING) {
      return;
    }

    if (this.selectedBombSlot !== null) {
      this.confirmSelectedBomb();
      return;
    }

    this.hardDrop();
  }

  hardDrop() {
    if (this.gameState !== GAME_STATES.PLAYING || this.isResolvingClears || !this.activePiece) {
      return;
    }

    const distance = this.gravity.getDropDistance(this.activePiece);
    this.sfx.playHardDrop();
    this.activePiece = this.activePiece.moved(0, distance);
    this.renderBoard();
    this.lockActivePiece();
  }

  async lockActivePiece() {
    if (!this.activePiece || this.isResolvingClears) {
      return;
    }

    this.cancelBombSelection();
    const lockedSuccessfully = this.board.lockPiece(this.activePiece);
    this.activePiece = null;

    if (!lockedSuccessfully) {
      this.renderBoard();
      this.endGame(ENDING_TYPES.STANDARD_GAME_OVER);
      return;
    }

    this.sfx.playLock();

    try {
      await this.resolveBoardAfterLock();
    } catch (error) {
      console.error('Board resolution failed after lock:', error);
      this.renderBoard();
    }

    if (this.gameState === GAME_STATES.PLAYING && !this.isGameOver) {
      if (this.shouldTriggerTrueEnd()) {
        this.endGame(ENDING_TYPES.TRUE_END);
        return;
      }

      this.spawnPiece();
    }
  }

  async resolveBoardAfterLock() {
    this.isResolvingClears = true;

    try {
      await this.applyBoardGravityStepwise();
      await this.resolveBoardClears();
    } finally {
      this.isResolvingClears = false;
      this.flushPendingBgmUpdateAfterResolution();
    }
  }

  async resolveBoardClears() {
    let nextChain = 1;
    let resolvedChains = 0;
    let clearedCanopicSet = false;
    let clearedSameType = false;
    let pureCanopicCount = 0;
    const unlockEvents = [];

    while (true) {
      const clearResult = this.findClearResult();
      if (clearResult.cellsToClear.length === 0) {
        break;
      }

      await this.highlightClearCells(clearResult);
      this.playClearSounds(clearResult, nextChain);
      await this.applyClearImpactFeedback(clearResult, nextChain);

      const earnedScore = this.scoreSystem.calculateCycleScore(clearResult, nextChain);
      const meterGain = this.scoreSystem.calculateCycleMeterPoints(clearResult, nextChain);
      this.score += earnedScore;
      unlockEvents.push(...this.coffinMeter.addPoints(meterGain));
      this.updateRunProgressionRecords();
      resolvedChains = nextChain;
      clearedCanopicSet = clearedCanopicSet || clearResult.clearTypes.has('canopic');
      clearedSameType = clearedSameType || clearResult.clearTypes.has('sameType');
      pureCanopicCount += clearResult.pureCanopicCount;

      this.matchResolver.clearCells(clearResult.cellsToClear);
      await this.animateRevivedSoulAcquisition(clearResult);
      await this.applyBoardGravityStepwise();
      nextChain += 1;
    }

    this.chainCount = resolvedChains;
    this.bestChainThisRun = Math.max(this.bestChainThisRun, this.chainCount);
    this.updateRunProgressionRecords();
    this.hud.updateScore(this.score);
    this.hud.updateChain(this.chainCount);
    this.hud.updateCoffin(this.coffinMeter.getState());
    this.applyPureCanopicRewards(pureCanopicCount);

    if (clearedSameType || clearedCanopicSet || this.chainCount >= 2) {
      this.showClearFeedback(clearedSameType, clearedCanopicSet, this.chainCount);
      this.hud.showClearFeedback(clearedSameType, clearedCanopicSet, this.chainCount);
    }

    this.showUnlockEvents(unlockEvents);

    this.renderBoard();
  }

  selectBombSlot(slotIndex) {
    if (this.gameState !== GAME_STATES.PLAYING || this.isResolvingClears || !this.activePiece) {
      return;
    }

    if (!this.bombSystem.hasBombAt(slotIndex)) {
      this.cancelBombSelection();
      return;
    }

    if (this.selectedBombSlot === slotIndex) {
      this.confirmSelectedBomb();
      return;
    }

    this.selectedBombSlot = slotIndex;
    this.sfx.playBombSelect();
    this.hud.updateBombStock(this.bombSystem.getStock(), this.selectedBombSlot);
    this.emitTouchControlState();
    this.updateBombPreview();
  }

  cancelBombSelection() {
    if (this.selectedBombSlot === null && this.bombPreviewSprites.length === 0) {
      return;
    }

    this.selectedBombSlot = null;
    this.clearBombPreview();
    this.hud.updateBombStock(this.bombSystem.getStock(), this.selectedBombSlot);
    this.emitTouchControlState();
  }

  confirmSelectedBomb() {
    if (this.selectedBombSlot === null) {
      return;
    }

    if (!this.validateBombSelection()) {
      return;
    }

    const slotIndex = this.selectedBombSlot;
    this.selectedBombSlot = null;
    this.clearBombPreview();
    this.hud.updateBombStock(this.bombSystem.getStock(), this.selectedBombSlot);
    this.emitTouchControlState();
    this.useBombSlot(slotIndex);
  }

  validateBombSelection() {
    if (this.selectedBombSlot === null) {
      return false;
    }

    if (this.gameState !== GAME_STATES.PLAYING || this.isResolvingClears || !this.activePiece || !this.bombSystem.hasBombAt(this.selectedBombSlot)) {
      this.cancelBombSelection();
      return false;
    }

    return true;
  }

  getActiveBombTarget() {
    if (!this.activePiece) {
      return null;
    }

    return {
      col: this.activePiece.col,
      row: Math.max(0, this.activePiece.row),
    };
  }

  async useBombSlot(slotIndex) {
    if (this.gameState !== GAME_STATES.PLAYING || this.isResolvingClears || !this.activePiece) {
      return;
    }

    const target = this.getActiveBombTarget();
    const result = this.bombSystem.useBomb(slotIndex, target, this.board);

    if (!result) {
      return;
    }

    this.isResolvingClears = true;

    try {
      this.sfx.playBombUse();
      this.bgm.duck(700, 0.45);
      this.showBombAreaFlash(result.bomb.type, target);

      const clearedCells = this.matchResolver.clearCells(result.affectedCells);
      const convertedCells = this.convertBombCells(result.convertedCells);
      const changedCount = clearedCells.length + convertedCells.length;
      const earnedScore = (changedCount * this.bombSystem.getScorePerPiece(result.bomb.type))
        + this.bombSystem.getBonusScore(result.bomb.type);
      const unlockEvents = this.coffinMeter.addPoints(Math.floor(earnedScore * COFFIN_METER.bombGainRatio));

      this.score += earnedScore;
      this.updateRunProgressionRecords();
      this.hud.updateScore(this.score);
      this.hud.updateCoffin(this.coffinMeter.getState());

      if (clearedCells.length > 0) {
        await this.applyBoardGravityStepwise();
      } else {
        this.renderBoard();
      }

      this.hud.updateBombStock(this.bombSystem.getStock(), this.selectedBombSlot);
      this.hud.showBombUsed(result.bomb, changedCount);
      this.showBombFeedback(result.bomb, changedCount);
      this.showUnlockEvents(unlockEvents);
      await this.resolveBoardClears();
    } finally {
      this.isResolvingClears = false;
      this.flushPendingBgmUpdateAfterResolution();
    }
  }

  convertBombCells(cells) {
    const convertedCells = [];

    cells.forEach((cell) => {
      if (!this.board.isInsideColumn(cell.col) || !this.board.isVisibleRow(cell.row)) {
        return;
      }

      if (!this.board.getCell(cell.col, cell.row)) {
        return;
      }

      this.board.setCell(cell.col, cell.row, cell.toType);
      convertedCells.push(cell);
    });

    return convertedCells;
  }

  async applyBoardGravityStepwise() {
    let movedPieces = this.gravity.applyBoardGravityStep();

    if (movedPieces === 0) {
      this.renderBoard();
      return;
    }

    while (movedPieces > 0) {
      this.renderBoard();
      await this.wait(BOARD_GRAVITY_STEP_MS);
      movedPieces = this.gravity.applyBoardGravityStep();
    }

    this.renderBoard();
  }

  wait(ms) {
    return new Promise((resolve) => {
      let hasResolved = false;
      let timeoutId = null;

      const finish = () => {
        if (hasResolved) {
          return;
        }

        hasResolved = true;

        if (timeoutId !== null) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }

        resolve();
      };

      timeoutId = setTimeout(finish, ms + 25);

      if (this.time?.delayedCall) {
        try {
          this.time.delayedCall(ms, finish);
        } catch (error) {
          // The timeout fallback still resolves if Phaser's clock is unavailable.
        }
      } else {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(finish, ms);
      }
    });
  }

  highlightClearCells(clearResult) {
    const cells = this.getClearHighlightCells(clearResult);
    if (cells.length === 0) {
      return Promise.resolve();
    }

    const hasCanopicSet = clearResult.clearTypes.has('canopic');
    const hasAdjacentBrain = clearResult.clearTypes.has('adjacentBrain');
    const duration = hasCanopicSet
      ? CANOPIC_CLEAR_FLASH_MS
      : hasAdjacentBrain
        ? ADJACENT_BRAIN_CLEAR_FLASH_MS
        : SAME_TYPE_CLEAR_FLASH_MS;
    return this.flashCells(cells, { duration });
  }

  getClearHighlightCells(clearResult) {
    const cellMap = new Map();

    clearResult.sameTypeGroups.forEach((group) => {
      group.forEach((cell) => {
        cellMap.set(`${cell.col},${cell.row}`, {
          ...cell,
          highlightType: 'sameType',
        });
      });
    });

    clearResult.canopicSets.forEach((group) => {
      group.forEach((cell) => {
        cellMap.set(`${cell.col},${cell.row}`, {
          ...cell,
          highlightType: 'canopic',
        });
      });
    });

    if (clearResult.adjacentBrainBonusCell) {
      const cell = clearResult.adjacentBrainBonusCell;
      cellMap.set(`${cell.col},${cell.row}`, {
        ...cell,
        highlightType: 'adjacentBrain',
      });
    }

    return [...cellMap.values()];
  }

  flashCells(cells, { duration }) {
    this.clearClearHighlights();
    this.clearClearParticles();

    this.clearHighlightSprites = cells.flatMap((cell) => this.createClearHighlight(cell));
    this.spawnClearParticles(cells);

    return new Promise((resolve) => {
      this.clearHighlightTween = this.tweens.add({
        targets: this.clearHighlightSprites,
        alpha: { from: 0.2, to: 0.96 },
        scale: { from: 0.92, to: 1.08 },
        yoyo: true,
        repeat: 1,
        duration: Math.max(60, Math.round(duration / 4)),
        ease: 'Sine.easeInOut',
        onComplete: () => {
          this.clearHighlightTween = null;
          this.clearClearHighlights(false);
          resolve();
        },
      });
    });
  }

  createClearHighlight(cell) {
    const { x, y } = this.getCellCenter(cell.col, cell.row);
    const highlightStyle = this.getClearHighlightStyle(cell.highlightType);
    const cellSize = Math.max(10, this.layout.cellSize - 4);

    const core = this.add.rectangle(x, y, cellSize, cellSize, highlightStyle.fillColor, highlightStyle.fillAlpha)
      .setStrokeStyle(highlightStyle.strokeWidth, highlightStyle.strokeColor, highlightStyle.strokeAlpha)
      .setDepth(9)
      .setAlpha(0.2);

    const sprites = [core];

    if (highlightStyle.outerGlowColor) {
      const outer = this.add.rectangle(x, y, cellSize + 4, cellSize + 4, highlightStyle.outerGlowColor, highlightStyle.outerGlowAlpha)
        .setStrokeStyle(highlightStyle.outerStrokeWidth, highlightStyle.outerStrokeColor, highlightStyle.outerStrokeAlpha)
        .setDepth(8)
        .setAlpha(0.16);
      sprites.push(outer);
    }

    return sprites;
  }

  getClearHighlightStyle(highlightType) {
    if (highlightType === 'canopic') {
      return {
        fillColor: CANOPIC_CLEAR_FLASH_COLOR,
        strokeColor: CANOPIC_CLEAR_STROKE_COLOR,
        fillAlpha: 0.34,
        strokeAlpha: 0.96,
        strokeWidth: 3,
        outerGlowColor: CANOPIC_CLEAR_STROKE_COLOR,
        outerGlowAlpha: 0.2,
        outerStrokeColor: 0xffffff,
        outerStrokeAlpha: 0.46,
        outerStrokeWidth: 1,
      };
    }

    if (highlightType === 'adjacentBrain') {
      return {
        fillColor: 0x9b62c9,
        strokeColor: 0xe0b8ff,
        fillAlpha: 0.4,
        strokeAlpha: 0.96,
        strokeWidth: 3,
        outerGlowColor: 0x6a2f8f,
        outerGlowAlpha: 0.22,
        outerStrokeColor: 0xf4d77a,
        outerStrokeAlpha: 0.34,
        outerStrokeWidth: 1,
      };
    }

    return {
      fillColor: SAME_TYPE_CLEAR_FLASH_COLOR,
      strokeColor: 0xffefb0,
      fillAlpha: 0.28,
      strokeAlpha: 0.78,
      strokeWidth: 2,
      outerGlowColor: 0xe8b94a,
      outerGlowAlpha: 0.16,
      outerStrokeColor: 0xfff3c4,
      outerStrokeAlpha: 0.24,
      outerStrokeWidth: 1,
    };
  }

  clearClearHighlights(stopTween = true) {
    if (stopTween && this.clearHighlightTween) {
      this.clearHighlightTween.remove();
      this.clearHighlightTween = null;
    }

    this.clearHighlightSprites.forEach((sprite) => sprite.destroy());
    this.clearHighlightSprites = [];
  }

  spawnClearParticles(cells) {
    const particleCountPerCell = this.layout.cellSize <= 32 ? 2 : 3;
    const maxRadius = CLEAR_PARTICLE_BASE_RADIUS + this.layout.cellSize * CLEAR_PARTICLE_RADIUS_SCALE;
    const speed = CLEAR_PARTICLE_BASE_SPEED + this.layout.cellSize * CLEAR_PARTICLE_SPEED_SCALE;

    cells.forEach((cell) => {
      const style = this.getClearParticleStyle(cell.highlightType);
      const { x, y } = this.getCellCenter(cell.col, cell.row);

      for (let i = 0; i < particleCountPerCell; i += 1) {
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const distance = Phaser.Math.FloatBetween(4, this.layout.cellSize * 0.36);
        const particle = this.add.circle(
          x + Math.cos(angle) * distance * 0.28,
          y + Math.sin(angle) * distance * 0.28,
          Phaser.Math.FloatBetween(1.2, maxRadius),
          Phaser.Utils.Array.GetRandom(style.colors),
          style.alpha,
        ).setDepth(CLEAR_PARTICLE_DEPTH);

        const lifetime = Phaser.Math.Between(CLEAR_PARTICLE_LIFETIME_MIN_MS, CLEAR_PARTICLE_LIFETIME_MAX_MS);
        const travel = Phaser.Math.FloatBetween(speed * 0.45, speed);
        const tween = this.tweens.add({
          targets: particle,
          x: particle.x + Math.cos(angle) * travel,
          y: particle.y + Math.sin(angle) * travel - Phaser.Math.FloatBetween(4, 10),
          alpha: 0,
          scale: { from: 1, to: 0.7 },
          duration: lifetime,
          ease: 'Cubic.easeOut',
          onComplete: () => {
            this.clearParticleTweens = this.clearParticleTweens.filter((activeTween) => activeTween !== tween);
            this.clearParticleSprites = this.clearParticleSprites.filter((activeSprite) => activeSprite !== particle);
            particle.destroy();
          },
        });

        this.clearParticleSprites.push(particle);
        this.clearParticleTweens.push(tween);
      }
    });
  }

  getClearParticleStyle(highlightType) {
    if (highlightType === 'canopic') {
      return {
        colors: [0x62f4ff, 0x9ae8ff, 0xf4d77a],
        alpha: 0.8,
      };
    }

    if (highlightType === 'adjacentBrain') {
      return {
        colors: [0x7b2d8b, 0x4a245d, 0x241126],
        alpha: 0.7,
      };
    }

    return {
      colors: [0xf4d77a, 0xcfa76a, 0xb38a50],
      alpha: 0.72,
    };
  }

  clearClearParticles() {
    this.clearParticleTweens.forEach((tween) => tween?.remove?.());
    this.clearParticleTweens = [];

    this.clearParticleSprites.forEach((sprite) => sprite.destroy());
    this.clearParticleSprites = [];
  }

  updateBombPreview() {
    this.clearBombPreview();

    if (!this.validateBombSelection()) {
      return;
    }

    const bomb = this.bombSystem.getBombAt(this.selectedBombSlot);
    const target = this.getActiveBombTarget();
    if (!bomb || !target) {
      this.cancelBombSelection();
      return;
    }

    const style = this.getBombPreviewStyle(bomb.type);
    this.bombPreviewSprites = this.bombSystem.getPreviewCells(bomb.type, target, this.board).map((cell) => {
      const { x, y } = this.getCellCenter(cell.col, cell.row);
      return this.add.rectangle(x, y, this.layout.cellSize - 5, this.layout.cellSize - 5, style.fill, style.alpha)
        .setStrokeStyle(style.strokeWidth, style.stroke, style.strokeAlpha)
        .setDepth(6);
    });
  }

  getBombPreviewStyle(bombType) {
    const flashStyle = this.getBombAreaFlashStyle(bombType);
    return {
      fill: flashStyle.fill,
      stroke: flashStyle.stroke,
      alpha: Math.min(flashStyle.alpha * BOMB_PREVIEW_ALPHA_SCALE, 0.16),
      strokeAlpha: 0.42,
      strokeWidth: 1,
    };
  }

  clearBombPreview() {
    this.bombPreviewSprites.forEach((sprite) => sprite.destroy());
    this.bombPreviewSprites = [];
  }

  showBombAreaFlash(bombType, target) {
    this.clearBombAreaFlash();

    const cells = this.getBombAreaFlashCells(bombType, target);
    const style = this.getBombAreaFlashStyle(bombType);
    this.bombAreaFlashSprites = cells.map((cell) => {
      const x = this.layout.boardOriginX + cell.col * this.layout.cellSize + this.layout.cellSize / 2;
      const y = this.layout.boardOriginY + cell.row * this.layout.cellSize + this.layout.cellSize / 2;
      return this.add.rectangle(x, y, this.layout.cellSize - 3, this.layout.cellSize - 3, style.fill, style.alpha)
        .setStrokeStyle(style.strokeWidth ?? 2, style.stroke, 0.84)
        .setDepth(8);
    });

    if (this.bombAreaFlashSprites.length === 0) {
      return;
    }

    this.bombAreaFlashTween = this.tweens.add({
      targets: this.bombAreaFlashSprites,
      alpha: 0.05,
      duration: BOMB_AREA_FLASH_MS,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        this.bombAreaFlashTween = null;
        this.clearBombAreaFlash(false);
      },
    });
  }

  getBombAreaFlashStyle(bombType) {
    return BOMB_AREA_FLASH_STYLES[bombType] ?? {
      fill: BOMB_AREA_FLASH_COLOR,
      stroke: BOMB_AREA_FLASH_COLOR,
      alpha: 0.26,
    };
  }

  getBombAreaFlashCells(bombType, target) {
    return this.bombSystem.getPreviewCells(bombType, target, this.board);
  }

  clearBombAreaFlash(stopTween = true) {
    if (stopTween && this.bombAreaFlashTween) {
      this.bombAreaFlashTween.remove();
      this.bombAreaFlashTween = null;
    }

    this.bombAreaFlashSprites.forEach((sprite) => sprite.destroy());
    this.bombAreaFlashSprites = [];
  }


  playClearSounds(clearResult, chainCount) {
    const hasSameTypeClear = clearResult.clearTypes.has('sameType');
    const hasCanopicClear = clearResult.clearTypes.has('canopic');
    const hasChain = chainCount >= 2;

    if (hasSameTypeClear) {
      this.sfx.playClear();
    }

    if (hasCanopicClear) {
      this.sfx.playCanopic();
    }

    if (hasChain) {
      this.sfx.playChain(chainCount);
    }

    if (hasCanopicClear) {
      this.bgm.duck(700, 0.45);
    } else if (hasChain) {
      this.bgm.duck(650, 0.5);
    } else if (hasSameTypeClear) {
      this.bgm.duck(500, 0.55);
    }
  }

  toggleMute() {
    const isMuted = this.sfx.toggleMute();
    this.bgm.setMuted(isMuted);
    this.hud.updateSoundStatus(!isMuted);

    if (!isMuted) {
      this.safeUpdateBgmForGameState();
    }
  }

  toggleDebugMode() {
    if (this.gameState !== GAME_STATES.PLAYING) {
      return;
    }

    this.isDebugMode = !this.isDebugMode;
    this.hud.setDebugMode(this.isDebugMode);
    this.updateLayoutDebugOverlay();
  }

  handleDebugMeterKey(event) {
    if (this.gameState !== GAME_STATES.PLAYING || !this.isDebugMode) {
      return;
    }

    if (event?.shiftKey) {
      this.fillDebugGod();
      return;
    }

    this.addDebugMeterPoints(500);
  }

  addDebugMeterPoints(points) {
    const unlockEvents = this.coffinMeter.addPoints(points);
    this.updateRunProgressionRecords();
    this.hud.updateCoffin(this.coffinMeter.getState());
    this.showUnlockEvents(unlockEvents);
    this.safeUpdateBgmForGameState();
  }

  fillDebugGod() {
    const unlockEvents = this.coffinMeter.fillCurrentGod();
    this.updateRunProgressionRecords();
    this.hud.updateCoffin(this.coffinMeter.getState());
    this.showUnlockEvents(unlockEvents);
    this.safeUpdateBgmForGameState();
  }

  advanceDebugGod() {
    if (this.gameState !== GAME_STATES.PLAYING || !this.isDebugMode) {
      return;
    }

    this.fillDebugGod();
  }

  handleDebugTKey(event) {
    if (event?.shiftKey) {
      this.applyHighStatEndingTest();
      return;
    }

    this.advanceDebugGod();
  }

  handleDebugEndingShortcut(event) {
    if (!event?.shiftKey || !this.isDebugMode) {
      return;
    }

    if (event.keyCode === Phaser.Input.Keyboard.KeyCodes.E) {
      this.triggerDebugTrueEnd();
      return;
    }

    if (event.keyCode === Phaser.Input.Keyboard.KeyCodes.N) {
      this.triggerDebugNormalEnd();
    }
  }

  unlockToAmunRaForEndingTest() {
    while (!this.isAmunRaUnlocked() && !this.coffinMeter.isComplete()) {
      this.fillDebugGod();
    }
  }

  addDebugRevivedSouls(amount) {
    if (this.gameState !== GAME_STATES.PLAYING || !this.isDebugMode) {
      return;
    }

    const addAmount = Math.max(1, Math.floor(amount));
    this.revivedSoulsCount += addAmount;
    this.totalPureCanopicCount += addAmount;
    this.hud.updateRevivedSouls(this.revivedSoulsCount);
    this.updateDepthProgression();
    this.updateUnderworldDepthProgressHud();
    this.showDebugFeedback(`Revived souls +${addAmount}`);
  }

  applyHighStatEndingTest() {
    if (this.gameState !== GAME_STATES.PLAYING || !this.isDebugMode) {
      return;
    }

    this.unlockToAmunRaForEndingTest();
    this.revivedSoulsCount = 30;
    this.totalPureCanopicCount = 10;
    this.currentDepthLevel = DEPTH_MAX_LEVEL;
    this.updateRunProgressionRecords();
    this.hud.updateCoffin(this.coffinMeter.getState());
    this.hud.updateRevivedSouls(this.revivedSoulsCount);
    this.updateUnderworldDepthProgressHud();
    this.showDebugFeedback('Ending test stats applied');
  }

  triggerDebugTrueEnd() {
    if (this.gameState !== GAME_STATES.PLAYING || !this.isDebugMode) {
      return;
    }

    this.unlockToAmunRaForEndingTest();
    this.updateRunProgressionRecords();
    this.hud.updateCoffin(this.coffinMeter.getState());
    this.endGame(ENDING_TYPES.TRUE_END);
  }

  triggerDebugNormalEnd() {
    if (this.gameState !== GAME_STATES.PLAYING || !this.isDebugMode) {
      return;
    }

    this.unlockToAmunRaForEndingTest();
    this.updateRunProgressionRecords();
    this.hud.updateCoffin(this.coffinMeter.getState());
    this.endGame(ENDING_TYPES.NORMAL_END);
  }

  showDebugFeedback(message) {
    this.boardFeedbackText.setText(message);

    if (this.feedbackTimer) {
      this.feedbackTimer.remove(false);
    }

    this.feedbackTimer = this.time.delayedCall(1200, () => {
      this.boardFeedbackText.setText('');
      this.clearChainPopup();
    });
  }

  updateRunProgressionRecords() {
    const state = this.coffinMeter.getState();
    this.maxTierThisRun = Math.max(this.maxTierThisRun, state.currentTier?.tier ?? 4);
    this.maxGodsUnlockedThisRun = Math.max(this.maxGodsUnlockedThisRun, state.unlockedCount);
  }

  resetDebugProgression() {
    if (this.gameState !== GAME_STATES.PLAYING || !this.isDebugMode) {
      return;
    }

    this.coffinMeter.reset();
    this.updateRunProgressionRecords();
    this.cancelBombSelection();
    this.bombSystem.reset();
    this.hud.updateCoffin(this.coffinMeter.getState());
    this.hud.updateBombStock(this.bombSystem.getStock(), this.selectedBombSlot);
    this.safeUpdateBgmForGameState();
    this.showDebugFeedback('デバッグ進行リセット');
  }

  showUnlockEvents(unlockEvents) {
    if (unlockEvents.length === 0) {
      return;
    }

    this.bgm.duck(800, 0.4);
    this.sfx.playGodUnlock();
    const unlockEventsWithBombInfo = this.addBombsForUnlockEvents(unlockEvents);
    this.hud.showGodUnlocked(unlockEventsWithBombInfo);
    this.refreshAwakenedGodPresence();
    unlockEventsWithBombInfo.forEach((unlockEvent, index) => {
      this.time.delayedCall(index * 140, () => {
        this.playGodAwakeningPresence(unlockEvent?.god?.id);
      });
    });
  }

  playGodAwakeningPresence(godId) {
    const colors = {
      imsety: 0xe8c76e,
      hapy: 0x8ecff2,
      duamutef: 0xe09a6c,
      qebehsenuef: 0xb794f8,
    };
    const pulseColor = colors[godId] ?? 0xd4af37;
    const boardCenterX = this.layout.boardOriginX + (BOARD_COLUMNS * this.layout.cellSize) / 2;
    const boardCenterY = this.layout.boardOriginY + (BOARD_ROWS * this.layout.cellSize) / 2;
    const ripple = this.add.circle(boardCenterX, boardCenterY, 14, pulseColor, 0.08)
      .setStrokeStyle(2, 0xf2dfad, 0.42)
      .setDepth(5.2);

    this.tweens.add({
      targets: ripple,
      radius: GOD_AWAKENING_RIPPLE_MAX_RADIUS,
      alpha: 0,
      scaleX: 1.12,
      scaleY: 1.12,
      duration: GOD_AWAKENING_PRESENCE_MS,
      ease: 'Sine.easeOut',
      onComplete: () => ripple.destroy(),
    });

    if (this.boardOuterFrame && this.boardInnerFrame) {
      this.boardOuterFrame.setStrokeStyle(2, pulseColor, 0.94);
      this.boardInnerFrame.setStrokeStyle(2, 0xf4e9c8, 0.58);
      this.tweens.add({
        targets: [this.boardOuterFrame, this.boardInnerFrame],
        alpha: (target, key, value) => Math.min(1, value + 0.04),
        duration: 180,
        yoyo: true,
        ease: 'Sine.easeInOut',
        onComplete: () => {
          this.boardOuterFrame.setStrokeStyle(2, 0xd4af37, 0.82);
          this.boardInnerFrame.setStrokeStyle(1, 0xf0d27a, 0.35);
        },
      });
    }

    if (this.depthAtmosphere) {
      const { tint, glow, pulseLines, dustParticles } = this.depthAtmosphere;
      tint.setFillStyle(pulseColor, tint.alpha);
      this.tweens.add({
        targets: [tint, glow, pulseLines],
        alpha: (target, key, value) => value + 0.04,
        duration: 160,
        yoyo: true,
        ease: 'Sine.easeInOut',
        onComplete: () => this.updateDepthAtmosphereVisuals(false),
      });
      dustParticles.slice(0, 8).forEach((particle, index) => {
        this.tweens.add({
          targets: particle,
          x: particle.x + (index % 2 === 0 ? 5 : -5),
          duration: 120,
          yoyo: true,
          ease: 'Sine.easeInOut',
        });
      });
    }

    this.hud?.pulseAwakenedSigil(godId);
    this.hud?.pulseCurrentCoffin(godId);
  }

  addBombsForUnlockEvents(unlockEvents) {
    const unlockEventsWithBombInfo = unlockEvents.map((unlockEvent) => {
      const god = unlockEvent.god;
      const wasFullBeforeAdd = this.bombSystem.isFull();
      const grantedBomb = this.bombSystem.addBombForGod(god);

      return {
        ...unlockEvent,
        grantedBomb,
        grantStatus: grantedBomb
          ? 'granted'
          : wasFullBeforeAdd
            ? 'stock_full'
            : this.bombSystem.isSupportedBombType(god?.futureBombType)
              ? 'none'
              : god?.futureBombType
                ? 'unsupported'
                : 'none',
      };
    });
    this.hud.updateBombStock(this.bombSystem.getStock(), this.selectedBombSlot);
    this.validateBombSelection();
    return unlockEventsWithBombInfo;
  }


  async applyClearImpactFeedback(clearResult, chainCount) {
    const profile = this.getClearImpactProfile(clearResult, chainCount);

    if (profile.pureCanopicPulse) {
      const currentGod = this.coffinMeter.getState().currentGod;
      this.flashGodPresence(currentGod?.id);
      this.playPureCanopicPulse(clearResult);
      this.hud.showPureCanopicRitual(this.coffinMeter.getState().currentGod);
      await this.wait(profile.hitStopMs);
      return;
    }

    this.playBoardMicroShake(profile.shakeIntensity);
    if (profile.hitStopMs > 0) {
      await this.wait(profile.hitStopMs);
    }
  }

  getClearImpactProfile(clearResult, chainCount) {
    const clearSize = clearResult.cellsToClear.length;
    const chainTier = chainCount >= 4 ? 3 : chainCount >= 2 ? 2 : 1;
    const hasPureCanopic = clearResult.pureCanopicCount > 0;

    const sizeBoost = Phaser.Math.Clamp((clearSize - 4) * 1.8, 0, 16);
    const chainBoost = chainTier === 3 ? 14 : chainTier === 2 ? 8 : 0;
    const hitStopMs = Math.round(Phaser.Math.Clamp(CLEAR_HIT_STOP_MIN_MS + sizeBoost + chainBoost, CLEAR_HIT_STOP_MIN_MS, CLEAR_HIT_STOP_MAX_MS));

    const shakeTier = chainTier === 3 ? 1 : chainTier === 2 ? 0.55 : 0.18;
    const shakeIntensity = hasPureCanopic
      ? CAMERA_SHAKE_BASE_INTENSITY * 0.2
      : CAMERA_SHAKE_BASE_INTENSITY + CAMERA_SHAKE_CHAIN_SCALE * shakeTier;

    return {
      hitStopMs: hasPureCanopic ? PURE_CANOPIC_HIT_STOP_MS : hitStopMs,
      shakeIntensity: Phaser.Math.Clamp(shakeIntensity, 0, 0.0022),
      pureCanopicPulse: hasPureCanopic,
    };
  }

  playBoardMicroShake(intensity) {
    const camera = this.cameras?.main;
    if (!camera || intensity <= 0) {
      return;
    }

    if (camera.shakeEffect?.isRunning) {
      camera.stopShake();
    }

    camera.shake(CAMERA_SHAKE_DURATION_MS, intensity, false);
  }

  playPureCanopicPulse(clearResult) {
    this.clearPureCanopicPulse();
    const pulseCenter = this.getPureCanopicCenter(clearResult);

    const overlay = this.add.rectangle(
      pulseCenter.x,
      pulseCenter.y,
      this.layout.boardWidth,
      this.layout.boardHeight,
      0x62f4ff,
      0.02,
    ).setStrokeStyle(2, 0xf4d77a, 0.28).setDepth(PURE_CANOPIC_PULSE_DEPTH);
    const ripple = this.add.ellipse(
      pulseCenter.x,
      pulseCenter.y,
      this.layout.cellSize * 1.8,
      this.layout.cellSize * 1.8,
      0x62f4ff,
      0.16,
    ).setStrokeStyle(2, 0xf4d77a, 0.56).setDepth(PURE_CANOPIC_PULSE_DEPTH + 1);

    this.pureCanopicPulseOverlay = overlay;
    this.pureCanopicRipple = ripple;
    this.pureCanopicPulseTween = this.tweens.add({
      targets: overlay,
      alpha: { from: 0.24, to: 0 },
      scaleX: { from: 0.97, to: 1.025 },
      scaleY: { from: 0.97, to: 1.025 },
      duration: PURE_CANOPIC_PULSE_DURATION_MS,
      ease: 'Sine.easeOut',
      onComplete: () => {
        this.pureCanopicPulseTween = null;
      },
    });
    this.pureCanopicRippleTween = this.tweens.add({
      targets: ripple,
      alpha: { from: 0.24, to: 0 },
      scaleX: { from: 0.4, to: 3.3 },
      scaleY: { from: 0.4, to: 3.3 },
      duration: PURE_CANOPIC_PULSE_DURATION_MS,
      ease: 'Sine.easeOut',
      onComplete: () => {
        this.clearPureCanopicPulse(false);
      },
    });
  }

  getPureCanopicCenter(clearResult) {
    const pureGroups = clearResult.canopicSets.filter((group) => this.canopusResolver.isPureCanopicSet(group));
    if (pureGroups.length === 0) {
      return { x: this.layout.boardCenterX, y: this.layout.boardCenterY };
    }

    const allCells = pureGroups.flat();
    const sum = allCells.reduce((acc, cell) => {
      const center = this.getCellCenter(cell.col, cell.row);
      return { x: acc.x + center.x, y: acc.y + center.y };
    }, { x: 0, y: 0 });
    return { x: sum.x / allCells.length, y: sum.y / allCells.length };
  }

  clearPureCanopicPulse(stopTween = true) {
    if (stopTween && this.pureCanopicPulseTween) {
      this.pureCanopicPulseTween.remove();
      this.pureCanopicPulseTween = null;
    }
    if (stopTween && this.pureCanopicRippleTween) {
      this.pureCanopicRippleTween.remove();
      this.pureCanopicRippleTween = null;
    }

    if (this.pureCanopicPulseOverlay) {
      this.pureCanopicPulseOverlay.destroy();
      this.pureCanopicPulseOverlay = null;
    }
    if (this.pureCanopicRipple) {
      this.pureCanopicRipple.destroy();
      this.pureCanopicRipple = null;
    }
  }

  findClearResult() {
    const sameTypeGroups = this.matchResolver.findMatches();
    const canopicSets = this.canopusResolver.findCanopicSets();
    const pureCanopicCount = this.canopusResolver.countPureCanopicSets(canopicSets);
    const adjacentBrainBonusCell = this.canopusResolver.findAdjacentBrainBonusCell(canopicSets);
    const clearTypes = new Set();
    const cellMap = new Map();

    if (sameTypeGroups.length > 0) {
      clearTypes.add('sameType');
      this.addGroupsToCellMap(sameTypeGroups, cellMap);
    }

    if (canopicSets.length > 0) {
      clearTypes.add('canopic');
      this.addGroupsToCellMap(canopicSets, cellMap);
    }

    if (adjacentBrainBonusCell) {
      clearTypes.add('adjacentBrain');
      cellMap.set(`${adjacentBrainBonusCell.col},${adjacentBrainBonusCell.row}`, adjacentBrainBonusCell);
    }

    return {
      cellsToClear: [...cellMap.values()],
      clearTypes,
      sameTypeGroups,
      canopicSets,
      pureCanopicCount,
      adjacentBrainBonusCell,
    };
  }

  applyPureCanopicRewards(pureCanopicCount) {
    if (pureCanopicCount <= 0) {
      return;
    }

    this.totalPureCanopicCount += pureCanopicCount;
    this.updateUnderworldDepthProgressHud();
    this.showPureCanopicPopup();
    this.updateDepthProgression();
  }

  async animateRevivedSoulAcquisition(clearResult) {
    if (!clearResult || clearResult.pureCanopicCount <= 0 || !this.hud) {
      return;
    }

    const pureSoulOrigins = this.getPureCanopicSoulOrigins(clearResult);
    if (pureSoulOrigins.length === 0) {
      this.revivedSoulsCount += clearResult.pureCanopicCount;
      this.hud.updateRevivedSouls(this.revivedSoulsCount);
      this.hud.pulseRevivedSoulsPanel();
      return;
    }

    const hudTarget = this.hud.getRevivedSoulsTargetWorldPoint();
    const souls = pureSoulOrigins.map((origin) => this.createRevivedSoulVisual(origin));

    await Promise.all(souls.map((soul, index) => this.animateSoulToHud(soul, hudTarget, index)));

    this.revivedSoulsCount += clearResult.pureCanopicCount;
    this.hud.updateRevivedSouls(this.revivedSoulsCount);
    this.hud.pulseRevivedSoulsPanel();
  }

  getPureCanopicSoulOrigins(clearResult) {
    const pureGroups = clearResult.canopicSets.filter((group) => this.canopusResolver.isPureCanopicSet(group));
    return pureGroups.map((group) => {
      const center = group.reduce((acc, cell) => {
        const point = this.getCellCenter(cell.col, cell.row);
        return { x: acc.x + point.x, y: acc.y + point.y };
      }, { x: 0, y: 0 });
      return { x: center.x / group.length, y: center.y / group.length };
    });
  }

  createRevivedSoulVisual(origin) {
    const soul = this.add.container(origin.x, origin.y).setDepth(SOUL_ASCENT_DEPTH).setAlpha(0.96);
    const body = this.add.ellipse(0, 3, this.layout.cellSize * 0.24, this.layout.cellSize * 0.34, 0xe6d1a1, 0.95)
      .setStrokeStyle(1, 0xd4af37, 0.5);
    const head = this.add.circle(0, -4, this.layout.cellSize * 0.07, 0xefdfba, 0.96);
    const eyes = this.add.ellipse(0, -4, this.layout.cellSize * 0.045, this.layout.cellSize * 0.02, 0xf4d77a, 0.7);
    soul.add([body, head, eyes]);
    return soul;
  }

  animateSoulToHud(soul, hudTarget, index) {
    const driftX = (index % 2 === 0 ? -1 : 1) * (6 + index * 2);
    return new Promise((resolve) => {
      this.tweens.add({
        targets: soul,
        y: soul.y - Math.max(12, this.layout.cellSize * 0.5),
        x: soul.x + driftX,
        alpha: { from: 0.96, to: 1 },
        duration: SOUL_FLOAT_UP_MS,
        ease: 'Sine.easeOut',
        onComplete: () => {
          this.tweens.add({
            targets: soul,
            x: hudTarget.x,
            y: hudTarget.y,
            alpha: { from: 1, to: 0.1 },
            scaleX: { from: 1, to: 0.72 },
            scaleY: { from: 1, to: 0.72 },
            duration: SOUL_TO_HUD_MS,
            ease: 'Cubic.easeIn',
            onComplete: () => {
              soul.destroy();
              resolve();
            },
          });
        },
      });
    });
  }

  updateDepthProgression() {
    const nextDepth = this.resolveDepthLevelFromPureCanopicCount(this.totalPureCanopicCount);
    if (nextDepth <= this.currentDepthLevel) {
      return;
    }

    this.currentDepthLevel = nextDepth;
    this.hud.updateUnderworldDepth(this.currentDepthLevel, this.totalPureCanopicCount, DEPTH_PURE_CANOPIC_THRESHOLDS);
    this.updateDepthAtmosphereVisuals(false);
    this.applyAwakenedGodBoardPresence();
    this.showDepthTransition();
    this.playDepthTransitionPulse();
  }

  refreshAwakenedGodPresence() {
    const unlockedGods = this.coffinMeter.getUnlockedGods();
    this.awakenedGodIdsThisRun = new Set(unlockedGods.map((god) => god.id));
    this.hud?.updateAwakenedGodsPresence(unlockedGods);
    this.applyAwakenedGodBoardPresence();
  }

  applyAwakenedGodBoardPresence() {
    if (!this.depthAtmosphere) return;
    const unlockedGods = this.coffinMeter.getUnlockedGods();
    const unlockedCount = unlockedGods.length;
    const { tint, fog } = this.depthAtmosphere;
    const baseAlpha = 0.05 + Math.min(0.12, unlockedCount * 0.008);
    tint.setAlpha(baseAlpha);
    fog.setAlpha(0.02 + Math.min(0.08, unlockedCount * 0.006));
  }

  flashGodPresence(godId) {
    if (!this.depthAtmosphere) return;
    const colors = {
      imsety: 0xd9b35c,
      hapy: 0x68bde6,
      duamutef: 0xd98f53,
      qebehsenuef: 0x8f6fe4,
    };
    const pulseColor = colors[godId] ?? 0xd4af37;
    const { glow } = this.depthAtmosphere;
    glow.setFillStyle(pulseColor, glow.alpha);
    this.tweens.add({
      targets: glow,
      alpha: Math.min(0.24, glow.alpha + 0.1),
      duration: 180,
      yoyo: true,
      onComplete: () => this.updateDepthAtmosphereVisuals(false),
    });
  }

  playDepthTransitionPulse() {
    if (!this.depthAtmosphere) return;
    const { tint, fog, glow, corruption, eyeGlow } = this.depthAtmosphere;
    this.tweens.add({
      targets: [tint, fog, glow, corruption, eyeGlow],
      alpha: (target, key, value) => value + 0.04,
      duration: 200,
      yoyo: true,
      ease: 'Sine.easeInOut',
    });
    this.hud?.pulseDepthTransition();
  }

  resolveDepthLevelFromPureCanopicCount(totalPureCanopicCount) {
    let depthLevel = 1;
    DEPTH_PURE_CANOPIC_THRESHOLDS.forEach((threshold, index) => {
      if (totalPureCanopicCount >= threshold) {
        depthLevel = index + 1;
      }
    });
    return Math.min(depthLevel, DEPTH_MAX_LEVEL);
  }

  updateUnderworldDepthProgressHud() {
    this.hud?.updateUnderworldDepth(this.currentDepthLevel, this.totalPureCanopicCount, DEPTH_PURE_CANOPIC_THRESHOLDS);
  }

  showDepthTransition() {
    if (!this.depthTransitionText) {
      return;
    }
    if (this.depthTransitionTween) {
      this.depthTransitionTween.stop();
      this.depthTransitionTween = null;
    }

    const message = DEPTH_TRANSITION_MESSAGES[this.currentDepthLevel - 1] ?? `UNDERWORLD DEPTH ${this.currentDepthLevel}`;
    this.depthTransitionText.setText(message);
    this.depthTransitionText.setScale(0.98);
    this.depthTransitionText.setAlpha(0);
    this.depthTransitionText.setY(this.layout.boardOriginY + 104);

    this.depthTransitionTween = this.tweens.add({
      targets: this.depthTransitionText,
      alpha: { from: 0, to: 0.92 },
      y: { from: this.layout.boardOriginY + 108, to: this.layout.boardOriginY + 98 },
      scale: { from: 0.98, to: 1.01 },
      ease: 'Sine.easeInOut',
      duration: 360,
      hold: 680,
      yoyo: true,
      onComplete: () => {
        this.depthTransitionText.setAlpha(0);
        this.depthTransitionTween = null;
      },
    });
  }

  addGroupsToCellMap(groups, cellMap) {
    groups.forEach((group) => {
      group.forEach((cell) => {
        cellMap.set(`${cell.col},${cell.row}`, cell);
      });
    });
  }


  safeUpdateBgmForGameState() {
    if (this.isResolvingClears) {
      this.pendingBgmUpdateAfterResolution = true;
      return;
    }

    try {
      this.updateBgmForGameState();
    } catch (error) {
      console.warn('BGM update failed; gameplay will continue.', error);
    }
  }

  flushPendingBgmUpdateAfterResolution() {
    if (!this.pendingBgmUpdateAfterResolution) {
      return;
    }

    this.pendingBgmUpdateAfterResolution = false;
    this.safeUpdateBgmForGameState();
  }

  updateBgmForGameState() {
    if (this.gameState !== GAME_STATES.PLAYING && this.gameState !== GAME_STATES.PAUSED) {
      return;
    }

    this.refreshDangerState();
    const tier = this.getCurrentBgmTier();
    const selectedKey = getBgmKey(tier, this.isDangerState);
    this.logBgmStateIfChanged(tier, selectedKey);
    this.bgm.playForState(tier, this.isDangerState);

    if (this.gameState === GAME_STATES.PAUSED) {
      this.bgm.pause();
    }
  }

  getCurrentBgmTier() {
    return this.coffinMeter.getState().currentTier?.tier ?? 4;
  }

  logBgmStateIfChanged(tier, selectedKey) {
    const debugState = `${tier}:${this.isDangerState}:${selectedKey}`;

    if (debugState === this.lastBgmDebugState) {
      return;
    }

    this.lastBgmDebugState = debugState;
    console.debug('BGM state update', {
      tier,
      isDanger: this.isDangerState,
      selectedKey,
    });
  }

  refreshDangerState() {
    const highestLockedRow = this.getHighestLockedRow();

    if (highestLockedRow === null) {
      this.isDangerState = false;
      return;
    }

    if (this.isDangerState) {
      this.isDangerState = highestLockedRow <= DANGER_EXIT_ROW;
      return;
    }

    this.isDangerState = highestLockedRow <= DANGER_ENTER_ROW;
  }

  getHighestLockedRow() {
    for (let row = 0; row < this.board.rows; row += 1) {
      for (let col = 0; col < this.board.columns; col += 1) {
        if (this.board.getCell(col, row)) {
          return row;
        }
      }
    }

    return null;
  }


  isAmunRaUnlocked() {
    const unlockedGods = this.coffinMeter.getUnlockedGods();
    return unlockedGods.some((god) => god?.id === 'amun_ra');
  }

  shouldTriggerTrueEnd() {
    return this.isAmunRaUnlocked() && this.board.isCompletelyEmpty();
  }

  getEndingTypeForGameOver(requestedEndingType) {
    if (requestedEndingType === ENDING_TYPES.TRUE_END) {
      return ENDING_TYPES.TRUE_END;
    }

    if (this.isAmunRaUnlocked()) {
      return ENDING_TYPES.NORMAL_END;
    }

    return ENDING_TYPES.STANDARD_GAME_OVER;
  }

  endGame(requestedEndingType = ENDING_TYPES.STANDARD_GAME_OVER) {
    this.currentEndingType = this.getEndingTypeForGameOver(requestedEndingType);
    this.bgm.duck(900, 0.3);
    this.sfx.playGameOver();
    this.bgm.stop();
    this.gameState = GAME_STATES.GAME_OVER;
    this.isGameOver = true;
    this.activePiece = null;
    this.cancelBombSelection();
    this.pauseOverlay?.setVisible(false);
    const highScoreResult = this.recordHighScoreForCurrentRun();
    this.hud.updateBestScore(highScoreResult.records.highScore);
    this.hud.showGameOver();
    this.playGameOverAtmosphere();
    this.showGameOverOverlay(highScoreResult);
  }

  playGameOverAtmosphere() {
    if (!this.gameOverAtmosphere) {
      return;
    }

    this.hud.setGameOverAtmosphere(true);
    const { shade, sand } = this.gameOverAtmosphere;
    shade.setAlpha(0);
    sand.setAlpha(0);
    this.tweens.add({
      targets: shade,
      alpha: 0.52,
      duration: 720,
      ease: 'Sine.easeOut',
    });
    this.tweens.add({
      targets: sand,
      alpha: 0.16,
      duration: 920,
      ease: 'Sine.easeOut',
    });
  }

  resetGameOverAtmosphere() {
    if (!this.gameOverAtmosphere) {
      return;
    }

    this.hud.setGameOverAtmosphere(false);
    this.gameOverAtmosphere.shade.setAlpha(0);
    this.gameOverAtmosphere.sand.setAlpha(0);
  }

  recordHighScoreForCurrentRun() {
    this.updateRunProgressionRecords();
    const result = this.highScoreManager.recordRun({
      score: this.score,
      maxChain: this.bestChainThisRun,
      maxTier: this.maxTierThisRun,
      maxGodsUnlocked: this.maxGodsUnlockedThisRun,
    });

    this.highScoreRecords = result.records;
    return result;
  }

  showGameOverOverlay(highScoreResult) {
    if (this.gameOverOverlay) {
      this.gameOverOverlay.destroy(true);
    }

    const centerX = this.layout.boardOriginX + (BOARD_COLUMNS * this.layout.cellSize) / 2;
    const centerY = this.layout.boardOriginY + (BOARD_ROWS * this.layout.cellSize) / 2;
    const panelWidth = Math.min(350, GAME_WIDTH - 56);
    const panelHeight = this.currentEndingType === ENDING_TYPES.STANDARD_GAME_OVER ? 290 : 336;
    this.gameOverOverlay = this.add.container(centerX, centerY).setDepth(25).setAlpha(0);

    const titleText = this.currentEndingType === ENDING_TYPES.TRUE_END
      ? 'CONGRATULATIONS\nTHE SUN RISES AGAIN'
      : this.currentEndingType === ENDING_TYPES.NORMAL_END
        ? 'THE UNDERWORLD CLAIMED YOU'
        : 'GAME OVER';
    const subtitleText = this.currentEndingType === ENDING_TYPES.TRUE_END
      ? 'The revived souls rebuild the sacred horizon.'
      : this.currentEndingType === ENDING_TYPES.NORMAL_END
        ? 'Amun-Ra awakened, yet DUAT consumed the pilgrim.'
        : '魂は冥界へ沈んだ…';
    const promptText = this.currentEndingType === ENDING_TYPES.STANDARD_GAME_OVER
      ? 'Enter / Space で再挑戦'
      : 'Press Enter / Tap to return';

    const panel = this.add.rectangle(0, 0, panelWidth, panelHeight, 0x120806, 0.94).setStrokeStyle(2, 0xd4af37, 0.82);
    const title = this.add.text(0, -112, titleText, { fontFamily: 'Georgia, serif', fontSize: this.currentEndingType === ENDING_TYPES.STANDARD_GAME_OVER ? '34px' : '28px', color: '#d4af37', fontStyle: 'bold', align: 'center', stroke: '#1a1006', strokeThickness: 4 }).setOrigin(0.5);
    const subtitle = this.add.text(0, -66, subtitleText, { fontFamily: 'Arial, sans-serif', fontSize: '14px', color: '#cdb98b', align: 'center', fontStyle: 'italic' }).setOrigin(0.5);

    const recordText = this.add.text(0, this.currentEndingType === ENDING_TYPES.STANDARD_GAME_OVER ? 8 : 22, [
      `最終スコア: ${this.score}`,
      `ベストスコア: ${highScoreResult.records.highScore}`,
      highScoreResult.isNewHighScore ? '新記録!' : '',
      `最大連鎖: ${this.bestChainThisRun}`,
      `到達Tier: ${this.maxTierThisRun}`,
      `解放した神: ${this.maxGodsUnlockedThisRun}/${TOTAL_GOD_COUNT}`,
      this.currentEndingType !== ENDING_TYPES.STANDARD_GAME_OVER ? `Revived Souls: ${this.revivedSoulsCount}` : '',
      this.currentEndingType !== ENDING_TYPES.STANDARD_GAME_OVER ? `Deepest Depth: ${this.currentDepthLevel}` : '',
      this.currentEndingType !== ENDING_TYPES.STANDARD_GAME_OVER ? `PURE CANOPIC: ${this.totalPureCanopicCount}` : '',
    ].filter(Boolean).join('\n'), { fontFamily: 'Arial, sans-serif', fontSize: '15px', color: '#eadfca', align: 'center', lineSpacing: 5, wordWrap: { width: panelWidth - 36 } }).setOrigin(0.5);

    const nodes=[panel,title,subtitle,recordText];

    if (this.currentEndingType !== ENDING_TYPES.STANDARD_GAME_OVER) {
      this.playRitualEndingAtmosphere();
      const pyramid = this.createEndingPyramidVisualization(this.revivedSoulsCount, this.currentEndingType);
      pyramid.setY(82);
      nodes.push(pyramid);
    }

    const prompt = this.add.text(0, panelHeight / 2 - 28, promptText, { fontFamily: 'Arial, sans-serif', fontSize: '16px', color: '#f2d783', align: 'center', fontStyle: 'bold' }).setOrigin(0.5);
    nodes.push(prompt);

    if (highScoreResult.isNewHighScore) { recordText.setColor('#f4d77a'); recordText.setFontStyle('bold'); }

    this.gameOverOverlay.add(nodes);
    this.tweens.add({ targets: this.gameOverOverlay, alpha: 1, y: centerY - 6, duration: 650, ease: 'Sine.easeOut' });
    panel.setInteractive({ useHandCursor: true });
    prompt.setInteractive({ useHandCursor: true });
    panel.on('pointerdown', () => this.restartGame());
    prompt.on('pointerdown', () => this.restartGame());
  }

  playRitualEndingAtmosphere() {
    this.tweens.add({ targets: this.endingBoardFade, alpha: 0.62, duration: 950, ease: 'Sine.easeOut' });
    this.tweens.add({ targets: this.endingHudDimmer, alpha: 0.42, duration: 920, ease: 'Sine.easeOut' });
  }

  createEndingPyramidVisualization(revivedSoulsCount, endingType = ENDING_TYPES.TRUE_END) {
    const container = this.add.container(0, 0);
    const souls = Math.max(0, revivedSoulsCount);
    const soulScale = Phaser.Math.Clamp(souls / RITUAL_SOUL_CAP, 0, 1);
    const tierCount = Math.round(Phaser.Math.Linear(PYRAMID_MIN_TIERS, PYRAMID_MAX_TIERS, soulScale));
    const tierProgress = endingType === ENDING_TYPES.TRUE_END ? 1 : 0.55;
    const baseWidth = 182;
    const layerHeight = 8;
    const completeLayers = Math.max(1, Math.floor(tierCount * tierProgress));

    const dawnGlow = this.add.ellipse(0, -48, 232, 92, 0xb4d9ff, endingType === ENDING_TYPES.TRUE_END ? 0.18 : 0.09);
    container.add(dawnGlow);

    for (let index = 0; index < tierCount; index += 1) {
      const ratio = 1 - (index / (tierCount + 1));
      const width = Math.max(20, baseWidth * ratio);
      const y = 34 - (index * layerHeight);
      const isCompleted = index < completeLayers;
      const color = isCompleted ? (index % 2 === 0 ? 0x9f7a42 : 0xb99255) : 0x3f3020;
      const alpha = isCompleted ? (0.26 + (index / tierCount) * 0.26) : 0.22;
      const layer = this.add.rectangle(0, y, width, layerHeight, color, alpha).setStrokeStyle(1, 0xd8be80, isCompleted ? 0.28 : 0.12);
      container.add(layer);
    }

    const foregroundSand = this.add.ellipse(0, 44, 224, 30, 0x5f4528, 0.2);
    container.add(foregroundSand);

    this.addRitualSouls(container, souls, tierCount, completeLayers, endingType);
    return container;
  }

  addRitualSouls(container, souls, tierCount, completeLayers, endingType) {
    const visualSouls = Math.min(RITUAL_SOUL_CAP, Math.max(2, Math.floor(Math.sqrt(Math.max(1, souls)) * 4)));
    const completedHeight = completeLayers * 8;
    const incompleteBuild = completeLayers < tierCount;

    for (let index = 0; index < visualSouls; index += 1) {
      const ratio = visualSouls <= 1 ? 0.5 : index / (visualSouls - 1);
      const baseX = Phaser.Math.Linear(-84, 84, ratio) + Phaser.Math.Between(-4, 4);
      const baseY = 48 + Phaser.Math.Between(-2, 3);
      const soul = this.add.container(baseX, baseY);
      const body = this.add.rectangle(0, 0, 7, 12, 0xd8cab5, 0.84).setStrokeStyle(1, 0x5a4a36, 0.35);
      const head = this.add.circle(0, -8, 3, 0xe8dcc7, 0.86);
      const eyes = this.add.rectangle(0, -8, 3, 1, 0x8fd6ff, endingType === ENDING_TYPES.TRUE_END ? 0.45 : 0.16);
      soul.add([body, head, eyes]);
      container.add(soul);

      const carryY = 40 - (Math.min(completedHeight, 40) * (0.2 + ratio * 0.6));
      const buildTarget = incompleteBuild ? { x: baseX * 0.38, y: carryY } : { x: baseX, y: baseY };
      this.tweens.add({
        targets: soul,
        x: buildTarget.x,
        y: buildTarget.y,
        duration: 3600 + Phaser.Math.Between(0, 1800),
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 900),
      });
    }
  }

  renderBoard() {
    this.clearConnectionSprites();
    this.clearBlockSprites();
    this.drawLockedPieceConnections();

    for (let row = 0; row < this.board.rows; row += 1) {
      for (let col = 0; col < this.board.columns; col += 1) {
        const type = this.board.cells[row][col];
        if (type) {
          this.drawBlock(col, row, type, 1);
        }
      }
    }

    if (this.activePiece) {
      this.activePiece.getCells().forEach((cell) => {
        if (cell.row >= 0) {
          this.drawBlock(cell.col, cell.row, cell.type, 0.95);
        }
      });
    }

    this.safeUpdateBgmForGameState();
  }

  drawBlock(col, row, type, alpha) {
    const { x, y } = this.getCellCenter(col, row);

    this.blockSprites.push(this.createBlockSprite(x, y, type, alpha));
  }

  getCellCenter(col, row) {
    return {
      x: this.layout.boardOriginX + col * this.layout.cellSize + this.layout.cellSize / 2,
      y: this.layout.boardOriginY + row * this.layout.cellSize + this.layout.cellSize / 2,
    };
  }

  createBlockSprite(x, y, type, alpha) {
    const container = this.add.container(x, y);
    const asset = getPieceAsset(type);

    container.add(this.createPieceShadow(alpha));
    container.add(this.createFallbackBlock(type, alpha));

    if (asset && this.textures.exists(asset.key)) {
      container.add(this.add.image(0, 0, asset.key)
        .setDisplaySize(this.layout.cellSize - 10, this.layout.cellSize - 10)
        .setAlpha(alpha));
    }

    return container.setDepth(PIECE_SPRITE_DEPTH);
  }

  drawLockedPieceConnections() {
    const groupSizes = this.buildConnectedGroupSizeMap();

    for (let row = 0; row < this.board.rows; row += 1) {
      for (let col = 0; col < this.board.columns; col += 1) {
        const type = this.board.getCell(col, row);
        if (!this.canConnectType(type)) {
          continue;
        }

        const groupSize = groupSizes.get(`${col},${row}`) ?? 1;

        this.tryDrawConnection(col, row, col + 1, row, type, groupSize);
        this.tryDrawConnection(col, row, col, row + 1, type, groupSize);
      }
    }
  }

  canConnectType(type) {
    return Boolean(type) && type !== 'brain';
  }

  tryDrawConnection(fromCol, fromRow, toCol, toRow, type, groupSize) {
    if (!this.board.isInsideColumn(toCol) || !this.board.isVisibleRow(toRow)) {
      return;
    }

    if (this.board.getCell(toCol, toRow) !== type) {
      return;
    }

    const from = this.getCellCenter(fromCol, fromRow);
    const to = this.getCellCenter(toCol, toRow);
    const isHorizontal = fromRow === toRow;
    const thickness = this.getConnectorThickness(groupSize);
    const length = this.layout.cellSize * CONNECTOR_LENGTH_RATIO;
    const connectorColor = this.getConnectorColor(type, groupSize);
    const connector = this.createOrganicConnector(
      (from.x + to.x) / 2,
      (from.y + to.y) / 2,
      isHorizontal,
      length,
      thickness,
      connectorColor,
    ).setDepth(PIECE_CONNECTOR_DEPTH);

    this.connectionSprites.push(connector);
    this.startConnectorPulse(connector, groupSize);
  }

  createOrganicConnector(x, y, isHorizontal, length, thickness, color) {
    const container = this.add.container(x, y);
    const coreWidth = isHorizontal ? length : thickness;
    const coreHeight = isHorizontal ? thickness : length;
    const endOffset = (length - thickness) / 2;
    const bulgeThickness = thickness * (1 + CONNECTOR_BULGE_RATIO);

    container.add(this.add.ellipse(0, 0, coreWidth, coreHeight, color, CONNECTOR_ALPHA));

    if (isHorizontal) {
      container.add(this.add.circle(-endOffset, 0, thickness / 2, color, CONNECTOR_ALPHA));
      container.add(this.add.circle(endOffset, 0, thickness / 2, color, CONNECTOR_ALPHA));
      container.add(this.add.ellipse(0, 0, length * 0.64, bulgeThickness, color, CONNECTOR_ALPHA));
    } else {
      container.add(this.add.circle(0, -endOffset, thickness / 2, color, CONNECTOR_ALPHA));
      container.add(this.add.circle(0, endOffset, thickness / 2, color, CONNECTOR_ALPHA));
      container.add(this.add.ellipse(0, 0, bulgeThickness, length * 0.64, color, CONNECTOR_ALPHA));
    }

    return container;
  }

  startConnectorPulse(connector, groupSize) {
    const groupBoost = Math.min(
      CONNECTOR_PULSE_GROUP_ALPHA_BOOST_MAX,
      Math.max(0, groupSize - 2) * CONNECTOR_PULSE_GROUP_ALPHA_BOOST,
    );
    const alphaMin = CONNECTOR_PULSE_ALPHA_MIN;
    const alphaMax = Math.min(0.88, CONNECTOR_PULSE_ALPHA_MAX + groupBoost);

    connector.setAlpha(alphaMin);

    const pulseTween = this.tweens.add({
      targets: connector,
      alpha: { from: alphaMin, to: alphaMax },
      duration: CONNECTOR_PULSE_DURATION_MS,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });

    this.connectionPulseTweens.push(pulseTween);
  }

  getConnectorThickness(groupSize) {
    const baseThickness = this.layout.cellSize * CONNECTOR_THICKNESS_RATIO;
    return baseThickness * this.getConnectorScaleForGroupSize(groupSize);
  }

  getConnectorScaleForGroupSize(groupSize) {
    if (groupSize >= 5) {
      return 1.3;
    }
    if (groupSize >= 3) {
      return 1.15;
    }
    return 1;
  }

  getConnectorColor(type, groupSize) {
    const baseColor = PIECE_COLORS[type] ?? 0xd4af37;
    const tintDarken = groupSize >= 5 ? CONNECTOR_TINT_DARKEN_LARGE_GROUP : CONNECTOR_TINT_DARKEN;
    return Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.ValueToColor(baseColor),
      Phaser.Display.Color.ValueToColor(0x1a1207),
      100,
      Math.round(tintDarken * 100),
    ).color;
  }

  buildConnectedGroupSizeMap() {
    const visited = new Set();
    const groupSizes = new Map();

    for (let row = 0; row < this.board.rows; row += 1) {
      for (let col = 0; col < this.board.columns; col += 1) {
        const key = `${col},${row}`;
        if (visited.has(key)) {
          continue;
        }

        const type = this.board.getCell(col, row);
        if (!this.canConnectType(type)) {
          visited.add(key);
          continue;
        }

        const groupCells = this.collectOrthogonalGroup(col, row, type, visited);
        const groupSize = groupCells.length;
        groupCells.forEach((cellKey) => groupSizes.set(cellKey, groupSize));
      }
    }

    return groupSizes;
  }

  collectOrthogonalGroup(startCol, startRow, type, visited) {
    const queue = [{ col: startCol, row: startRow }];
    const groupCells = [];

    while (queue.length > 0) {
      const current = queue.shift();
      const key = `${current.col},${current.row}`;
      if (visited.has(key)) {
        continue;
      }

      visited.add(key);
      if (this.board.getCell(current.col, current.row) !== type) {
        continue;
      }

      groupCells.push(key);
      const neighbors = [
        { col: current.col - 1, row: current.row },
        { col: current.col + 1, row: current.row },
        { col: current.col, row: current.row - 1 },
        { col: current.col, row: current.row + 1 },
      ];

      neighbors.forEach((neighbor) => {
        if (!this.board.isInsideColumn(neighbor.col) || !this.board.isVisibleRow(neighbor.row)) {
          return;
        }

        const neighborKey = `${neighbor.col},${neighbor.row}`;
        if (!visited.has(neighborKey)) {
          queue.push(neighbor);
        }
      });
    }

    return groupCells;
  }

  createPieceShadow(alpha) {
    const shadow = this.add.ellipse(2, 4, this.layout.cellSize - 8, this.layout.cellSize - 8, 0x000000, 0.28 * alpha);
    const glow = this.add.rectangle(0, 0, this.layout.cellSize - 7, this.layout.cellSize - 7, 0xf4d77a, 0.08 * alpha);

    return [shadow, glow];
  }

  createFallbackBlock(type, alpha) {
    return this.add.rectangle(0, 0, this.layout.cellSize - 8, this.layout.cellSize - 8, PIECE_COLORS[type], 0.32 * alpha)
      .setStrokeStyle(1, 0xf6e3a1, 0.32);
  }

  clearConnectionSprites() {
    this.connectionPulseTweens.forEach((tween) => {
      if (tween?.isPlaying?.()) {
        tween.stop();
      }
      tween?.remove?.();
    });
    this.connectionPulseTweens = [];

    this.connectionSprites.forEach((sprite) => sprite.destroy());
    this.connectionSprites = [];
  }

  showBombFeedback(bomb, affectedCount) {
    const bombName = BOMB_LABELS_JA[bomb.type] ?? bomb.name;
    const message = this.bombSystem.isFinalStageBomb(bomb.type)
      ? `AMUN-RA 覚醒!\nDUAT COMPLETE!\n${affectedCount}個に影響`
      : `ボム!\n${bomb.godName} ${bombName}\n${affectedCount}個に影響`;

    this.boardFeedbackText.setText(message);
    this.boardFeedbackText.setAlpha(1);

    if (this.feedbackTimer) {
      this.feedbackTimer.remove(false);
    }

    this.feedbackTimer = this.time.delayedCall(this.bombSystem.isFinalStageBomb(bomb.type) ? 2200 : 1000, () => {
      this.boardFeedbackText.setText('');
    this.clearChainPopup();
    });
  }

  showClearFeedback(clearedSameType, clearedCanopicSet, chainCount) {
    const messages = [];

    if (clearedSameType) {
      messages.push('クリア!');
    }

    if (clearedCanopicSet) {
      messages.push('カノプスセット!');
    }

    this.showChainPopup(chainCount);

    this.boardFeedbackText.setText(messages.join('\n'));
    this.boardFeedbackText.setAlpha(1);

    if (this.feedbackTimer) {
      this.feedbackTimer.remove(false);
    }

    this.feedbackTimer = this.time.delayedCall(1200, () => {
      this.boardFeedbackText.setText('');
    this.clearChainPopup();
    });
  }



  showChainPopup(chainCount) {
    if (!this.chainPopupText || chainCount < 2) {
      return;
    }

    const visualTier = Math.min(chainCount, 4);
    const fontSizeByTier = { 2: 26, 3: 30, 4: 34 };
    const glowByTier = { 2: 12, 3: 20, 4: 28 };
    const alphaByTier = { 2: 0.9, 3: 1, 4: 1 };
    const pulseScaleByTier = { 2: 1.05, 3: 1.1, 4: 1.16 };
    const targetScale = pulseScaleByTier[visualTier] ?? 1.05;

    if (this.chainPopupTween) {
      this.chainPopupTween.stop();
      this.chainPopupTween = null;
    }

    this.chainPopupText.setText(`${chainCount} CHAIN`);
    this.chainPopupText.setFontSize(fontSizeByTier[visualTier] ?? 26);
    this.chainPopupText.setShadow(0, 0, '#f0c14f', glowByTier[visualTier] ?? 14, true, true);
    this.chainPopupText.setAlpha(0);
    this.chainPopupText.setScale(0.88);
    this.chainPopupText.setY(this.layout.boardOriginY + CHAIN_POPUP_TOP_OFFSET);
    this.chainPopupText.setDepth(CHAIN_POPUP_DEPTH);

    this.chainPopupTween = this.tweens.add({
      targets: this.chainPopupText,
      alpha: { from: 0, to: alphaByTier[visualTier] ?? 0.9 },
      y: {
        from: this.layout.boardOriginY + CHAIN_POPUP_RISE_START_OFFSET,
        to: this.layout.boardOriginY + CHAIN_POPUP_RISE_END_OFFSET,
      },
      scale: { from: 0.88, to: targetScale },
      ease: 'Sine.easeOut',
      duration: 220,
      yoyo: true,
      hold: 280,
      onComplete: () => {
        this.chainPopupText.setAlpha(0);
        this.chainPopupText.setScale(1);
        this.chainPopupText.setY(this.layout.boardOriginY + CHAIN_POPUP_TOP_OFFSET);
        this.chainPopupTween = null;
      },
    });
  }

  clearChainPopup() {
    if (!this.chainPopupText) {
      return;
    }

    if (this.chainPopupTween) {
      this.chainPopupTween.stop();
      this.chainPopupTween = null;
    }

    this.chainPopupText.setAlpha(0);
    this.chainPopupText.setScale(1);
    this.chainPopupText.setText('');
    this.chainPopupText.setY(this.layout.boardOriginY + CHAIN_POPUP_TOP_OFFSET);
  }

  showPureCanopicPopup() {
    if (!this.pureCanopicPopupText) {
      return;
    }

    if (this.pureCanopicPopupTween) {
      this.pureCanopicPopupTween.stop();
      this.pureCanopicPopupTween = null;
    }

    this.pureCanopicPopupText.setText('PURE CANOPIC');
    this.pureCanopicPopupText.setAlpha(0);
    this.pureCanopicPopupText.setScale(0.96);
    this.pureCanopicPopupText.setY(this.layout.boardOriginY + 56);

    this.pureCanopicPopupTween = this.tweens.add({
      targets: this.pureCanopicPopupText,
      alpha: { from: 0, to: 0.95 },
      y: { from: this.layout.boardOriginY + 62, to: this.layout.boardOriginY + 52 },
      scale: { from: 0.96, to: 1.03 },
      ease: 'Sine.easeInOut',
      duration: 320,
      yoyo: true,
      hold: 360,
      onComplete: () => {
        this.clearPureCanopicPopup();
      },
    });
  }

  clearPureCanopicPopup() {
    if (!this.pureCanopicPopupText) {
      return;
    }

    if (this.pureCanopicPopupTween) {
      this.pureCanopicPopupTween.stop();
      this.pureCanopicPopupTween = null;
    }

    this.pureCanopicPopupText.setAlpha(0);
    this.pureCanopicPopupText.setScale(1);
    this.pureCanopicPopupText.setText('');
    this.clearPureCanopicPulse();
  }

  clearBlockSprites() {
    this.blockSprites.forEach((sprite) => sprite.destroy());
    this.blockSprites = [];
  }
}

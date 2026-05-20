import {
  BOARD_COLUMNS,
  BOARD_ROWS,
  BOARD_ORIGIN_X,
  BOARD_ORIGIN_Y,
  CELL_SIZE,
  GAME_HEIGHT,
  GAME_WIDTH,
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
import { COFFIN_METER, DANGER_BGM } from '../data/balance.js';

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
const SAME_TYPE_CLEAR_FLASH_MS = 320;
const CANOPIC_CLEAR_FLASH_MS = 420;
const SAME_TYPE_CLEAR_FLASH_COLOR = 0xf4d77a;
const CANOPIC_CLEAR_FLASH_COLOR = 0x62f4ff;
const CANOPIC_CLEAR_STROKE_COLOR = 0xf4d77a;
const BOARD_GRAVITY_STEP_MS = 55;
const DANGER_ENTER_ROW = DANGER_BGM.enterRow;
const DANGER_EXIT_ROW = DANGER_BGM.exitRow;
const GAME_STATES = {
  TITLE: 'title',
  PLAYING: 'playing',
  PAUSED: 'paused',
  GAME_OVER: 'gameOver',
};

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
    title: '遊び方 1/3：基本ルール',
    body: [
      '・落ちてくる2つのピースを操作します。',
      '・同じ臓器ピースを4つ以上つなげると消えます。',
      '・消えたあと、上のピースは下へ落ちます。',
      '・連鎖するとスコアが伸びます。',
      '',
      '操作:',
      '← / →：移動',
      '↓：ソフトドロップ',
      '↑ / Z：回転',
      'Space：ハードドロップ',
    ].join('\n'),
  },
  {
    title: '遊び方 2/3：カノプスセットと脳',
    body: [
      '・肝臓、肺、胃、腸をひとつのつながったグループにそろえると、\nカノプスセットが成立します。',
      '・心臓は、足りない臓器1種類の代わりになります。',
      '・カノプスセットは高得点で、棺メーターもたまりやすくなります。',
      '',
      '脳ピース:',
      '・脳は障害ピースです。',
      '・脳は、一定確率で降ってくる障害ピースです。',
      '・脳は4つそろえても消えません。',
      '・脳はカノプスセットのつながりにも使えません。',
      '・カノプスセット成立時、隣接する脳を最大1つ巻き込んで消せます。',
      '・強力なボムでも脳を消せます。',
    ].join('\n'),
  },
  {
    title: '遊び方 3/3：棺・神・ボム',
    body: [
      '・ピースを消すと棺メーターがたまります。',
      '・棺メーターが満タンになると神が目覚めます。',
      '・目覚めた神はボムを授けてくれます。',
      '・Tierが上がるほど、ボムは強力になります。',
      '',
      'ボム操作:',
      '1〜4：ボム選択',
      '同じ数字をもう一度：発動',
      'Enter / Space / DROP：発動',
      'Esc：キャンセル',
      '',
      'その他:',
      'Enter：ポーズ / 再開',
      'M：ミュート',
    ].join('\n'),
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
    this.level = INITIAL_LEVEL;
    this.activePiece = null;
    this.nextPairTypes = createRandomPairTypes();
    this.blockSprites = [];
    this.fallTimer = 0;
    this.lockTimer = 0;
    this.gameState = GAME_STATES.TITLE;
    this.isGameOver = false;
    this.isDebugMode = false;
    this.feedbackTimer = null;
    this.chainPopupText = null;
    this.chainPopupTween = null;
    this.bombAreaFlashSprites = [];
    this.bombAreaFlashTween = null;
    this.bombPreviewSprites = [];
    this.selectedBombSlot = null;
    this.clearHighlightSprites = [];
    this.clearHighlightTween = null;
    this.isResolvingClears = false;
    this.titleOverlay = null;
    this.howToPlayOverlay = null;
    this.howToPlayTitleText = null;
    this.howToPlayPageIndicatorText = null;
    this.howToPlayBodyText = null;
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
    this.isTouchSoftDropping = false;
    this.touchActionHandler = null;

    this.createBackground();
    this.createInput();
    this.hud = new Hud(this, 390, 16);
    this.hud.updateScore(this.score);
    this.hud.updateChain(this.chainCount);
    this.hud.updateBestScore(this.highScoreRecords.highScore);
    this.hud.updateLevel(this.level);
    this.hud.setDebugMode(this.isDebugMode);
    this.hud.updateCoffin(this.coffinMeter.getState());
    this.hud.updateBombStock(this.bombSystem.getStock(), this.selectedBombSlot);
    this.hud.drawNext(this.nextPairTypes);
    this.hud.updateSoundStatus(!this.sfx.isMuted);
    this.createTitleOverlay();
  }

  update(_, delta) {
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

  createBackground() {
    this.cameras.main.setBackgroundColor('#080704');

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x090705);
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH - 40, GAME_HEIGHT - 40, 0x17100a, 0.72)
      .setStrokeStyle(1, 0x6e5525, 0.32);

    const boardCenterX = BOARD_ORIGIN_X + (BOARD_COLUMNS * CELL_SIZE) / 2;
    const boardCenterY = BOARD_ORIGIN_Y + (BOARD_ROWS * CELL_SIZE) / 2;
    const boardWidth = BOARD_COLUMNS * CELL_SIZE;
    const boardHeight = BOARD_ROWS * CELL_SIZE;

    this.add.rectangle(boardCenterX, boardCenterY, boardWidth + 28, boardHeight + 28, 0x332313, 0.95)
      .setStrokeStyle(2, 0xd4af37, 0.82);
    this.add.rectangle(boardCenterX, boardCenterY, boardWidth + 16, boardHeight + 16, 0x0c0a08, 0.98)
      .setStrokeStyle(1, 0xf0d27a, 0.35);
    this.add.rectangle(boardCenterX, boardCenterY, boardWidth, boardHeight, 0x12100d, 1);

    this.drawBoardCornerAccents(boardCenterX, boardCenterY, boardWidth, boardHeight);

    this.gridGraphics = this.add.graphics();
    this.gridGraphics.lineStyle(1, 0x8b7446, 0.2);

    for (let col = 0; col <= BOARD_COLUMNS; col += 1) {
      const x = BOARD_ORIGIN_X + col * CELL_SIZE;
      this.gridGraphics.lineBetween(x, BOARD_ORIGIN_Y, x, BOARD_ORIGIN_Y + boardHeight);
    }

    for (let row = 0; row <= BOARD_ROWS; row += 1) {
      const y = BOARD_ORIGIN_Y + row * CELL_SIZE;
      this.gridGraphics.lineBetween(BOARD_ORIGIN_X, y, BOARD_ORIGIN_X + boardWidth, y);
    }

    this.boardFeedbackText = this.add.text(boardCenterX, BOARD_ORIGIN_Y + 18, '', {
      fontFamily: 'Georgia, serif',
      fontSize: '24px',
      color: '#f4d77a',
      fontStyle: 'bold',
      align: 'center',
      stroke: '#1a1006',
      strokeThickness: 4,
    }).setOrigin(0.5, 0).setDepth(10);
    this.chainPopupText = this.add.text(boardCenterX, BOARD_ORIGIN_Y - 22, '', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '24px',
      color: '#f6d978',
      stroke: '#4f3b11',
      strokeThickness: 5,
      align: 'center',
      shadow: { offsetX: 0, offsetY: 0, color: '#f0c14f', blur: 14, fill: true },
    }).setOrigin(0.5, 1).setDepth(24).setAlpha(0);

    this.createGameOverAtmosphere();
  }

  createGameOverAtmosphere() {
    const boardCenterX = BOARD_ORIGIN_X + (BOARD_COLUMNS * CELL_SIZE) / 2;
    const boardCenterY = BOARD_ORIGIN_Y + (BOARD_ROWS * CELL_SIZE) / 2;
    const boardWidth = BOARD_COLUMNS * CELL_SIZE;
    const boardHeight = BOARD_ROWS * CELL_SIZE;
    const shade = this.add.rectangle(boardCenterX, boardCenterY, boardWidth + 40, boardHeight + 40, 0x050301, 0)
      .setDepth(22);
    const sand = this.add.rectangle(boardCenterX, boardCenterY, boardWidth + 16, boardHeight + 16, 0x8a6738, 0)
      .setDepth(22);
    this.gameOverAtmosphere = { shade, sand };
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
    const title = this.add.text(0, -232, 'DUAT', {
      fontFamily: 'Georgia, serif',
      fontSize: '58px',
      color: '#d4af37',
      fontStyle: 'bold',
      align: 'center',
      stroke: '#050301',
      strokeThickness: 6,
    }).setOrigin(0.5);
    const subtitle = this.add.text(0, -184, '古代エジプト落ち物パズル', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '22px',
      color: '#f4d77a',
      align: 'center',
    }).setOrigin(0.5);
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
      'Esc：取消 / M：ミュート',
    ].join('\n'), {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      color: '#d9c8a8',
      align: 'center',
      lineSpacing: 3,
    }).setOrigin(0.5);
    const keyboardPrompt = this.add.text(0, 156, 'Enter / Space：開始　H：遊び方', {
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

    this.titleOverlay.add([
      panel,
      innerPanel,
      title,
      subtitle,
      description,
      bestText,
      controls,
      keyboardPrompt,
      startButton.container,
      howToButton.container,
      tapHint,
    ]);
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
    const panel = this.add.rectangle(0, 0, 700, 560, 0x100b06, 0.98)
      .setStrokeStyle(2, 0xd4af37, 0.88);
    const innerPanel = this.add.rectangle(0, 0, 660, 518, 0x1b1208, 0.82)
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

    this.howToPlayBodyText = this.add.text(-300, -188, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: '#eadfca',
      lineSpacing: 7,
      wordWrap: { width: 600 },
    }).setOrigin(0, 0);

    this.howToPlayFooterText = this.add.text(0, 188, '←/→・A/D：ページ移動　Enter / Space：次へ　Esc：閉じる', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      color: '#bcae90',
      align: 'center',
      wordWrap: { width: 610 },
    }).setOrigin(0.5);

    this.howToPlayPreviousButton = this.createHowToPlayButton(-170, 236, 120, '前へ', () => this.showPreviousHelpPage());
    this.howToPlayNextButton = this.createHowToPlayButton(0, 236, 120, '次へ', () => this.showNextHelpPage());
    const closeButton = this.createHowToPlayButton(170, 236, 120, '閉じる', () => this.closeHowToPlay());

    this.howToPlayOverlay.add([
      shade,
      panel,
      innerPanel,
      this.howToPlayTitleText,
      this.howToPlayPageIndicatorText,
      this.howToPlayBodyText,
      this.howToPlayFooterText,
      this.howToPlayPreviousButton.container,
      this.howToPlayNextButton.container,
      closeButton.container,
    ]);
    shade.setInteractive();
    panel.setInteractive();
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

  updateHowToPlayPage() {
    const page = HOW_TO_PLAY_PAGES[this.helpPageIndex];
    this.howToPlayTitleText?.setText(page.title);
    this.howToPlayPageIndicatorText?.setText(`遊び方 ${this.helpPageIndex + 1} / ${HOW_TO_PLAY_PAGES.length}`);
    this.howToPlayBodyText?.setText(page.body);
    this.updateHowToPlayButtonState(this.howToPlayPreviousButton, this.helpPageIndex > 0);
    this.updateHowToPlayButtonState(this.howToPlayNextButton, this.helpPageIndex < HOW_TO_PLAY_PAGES.length - 1);
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
    this.howToPlayOverlay?.setVisible(true);
  }

  closeHowToPlay() {
    if (!this.isHowToPlayOpen) {
      return;
    }

    this.isHowToPlayOpen = false;
    this.howToPlayOverlay?.setVisible(false);
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
    this.activePiece = null;
    this.nextPairTypes = createRandomPairTypes();
    this.fallTimer = 0;
    this.lockTimer = 0;
    this.isGameOver = false;
    this.isDebugMode = false;
    this.isResolvingClears = false;
    this.isTouchSoftDropping = false;
    this.isDangerState = false;
    this.pendingBgmUpdateAfterResolution = false;
    this.lastBgmDebugState = null;
    this.bgm.stop();
    this.clearTransientVisuals();
    this.resetGameOverAtmosphere();
    this.updateHudForReset();
    this.renderBoard();
  }

  clearTransientVisuals() {
    this.cancelBombSelection();
    this.clearBombAreaFlash();
    this.clearClearHighlights();
    this.boardFeedbackText.setText('');
    this.clearChainPopup();

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
    this.keyT.on('down', () => this.advanceDebugGod());
    this.keyR.on('down', () => this.handleRestartOrDebugReset());
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

  handleRestartOrDebugReset() {
    if (this.gameState === GAME_STATES.GAME_OVER) {
      this.restartGame();
      return;
    }

    if (this.gameState === GAME_STATES.PLAYING) {
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
      this.endGame();
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
      this.endGame();
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
    const unlockEvents = [];

    while (true) {
      const clearResult = this.findClearResult();
      if (clearResult.cellsToClear.length === 0) {
        break;
      }

      await this.highlightClearCells(clearResult);
      this.playClearSounds(clearResult, nextChain);

      const earnedScore = this.scoreSystem.calculateCycleScore(clearResult, nextChain);
      const meterGain = this.scoreSystem.calculateCycleMeterPoints(clearResult, nextChain);
      this.score += earnedScore;
      unlockEvents.push(...this.coffinMeter.addPoints(meterGain));
      this.updateRunProgressionRecords();
      resolvedChains = nextChain;
      clearedCanopicSet = clearedCanopicSet || clearResult.clearTypes.has('canopic');
      clearedSameType = clearedSameType || clearResult.clearTypes.has('sameType');

      this.matchResolver.clearCells(clearResult.cellsToClear);
      await this.applyBoardGravityStepwise();
      nextChain += 1;
    }

    this.chainCount = resolvedChains;
    this.bestChainThisRun = Math.max(this.bestChainThisRun, this.chainCount);
    this.updateRunProgressionRecords();
    this.hud.updateScore(this.score);
    this.hud.updateChain(this.chainCount);
    this.hud.updateCoffin(this.coffinMeter.getState());

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
    const duration = hasCanopicSet ? CANOPIC_CLEAR_FLASH_MS : SAME_TYPE_CLEAR_FLASH_MS;
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

    this.clearHighlightSprites = cells.map((cell) => this.createClearHighlight(cell));

    return new Promise((resolve) => {
      this.clearHighlightTween = this.tweens.add({
        targets: this.clearHighlightSprites,
        alpha: { from: 0.78, to: 0.18 },
        yoyo: true,
        repeat: 1,
        duration: duration / 4,
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
    const x = BOARD_ORIGIN_X + cell.col * CELL_SIZE + CELL_SIZE / 2;
    const y = BOARD_ORIGIN_Y + cell.row * CELL_SIZE + CELL_SIZE / 2;
    const highlightStyle = this.getClearHighlightStyle(cell.highlightType);

    return this.add.rectangle(x, y, CELL_SIZE - 4, CELL_SIZE - 4, highlightStyle.fillColor, highlightStyle.fillAlpha)
      .setStrokeStyle(highlightStyle.strokeWidth, highlightStyle.strokeColor, highlightStyle.strokeAlpha)
      .setDepth(9);
  }

  getClearHighlightStyle(highlightType) {
    if (highlightType === 'canopic') {
      return {
        fillColor: CANOPIC_CLEAR_FLASH_COLOR,
        strokeColor: CANOPIC_CLEAR_STROKE_COLOR,
        fillAlpha: 0.34,
        strokeAlpha: 0.92,
        strokeWidth: 3,
      };
    }

    if (highlightType === 'adjacentBrain') {
      return {
        fillColor: 0x9b62c9,
        strokeColor: CANOPIC_CLEAR_STROKE_COLOR,
        fillAlpha: 0.38,
        strokeAlpha: 0.95,
        strokeWidth: 3,
      };
    }

    return {
      fillColor: SAME_TYPE_CLEAR_FLASH_COLOR,
      strokeColor: SAME_TYPE_CLEAR_FLASH_COLOR,
      fillAlpha: 0.25,
      strokeAlpha: 0.72,
      strokeWidth: 2,
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
      return this.add.rectangle(x, y, CELL_SIZE - 5, CELL_SIZE - 5, style.fill, style.alpha)
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
      const x = BOARD_ORIGIN_X + cell.col * CELL_SIZE + CELL_SIZE / 2;
      const y = BOARD_ORIGIN_Y + cell.row * CELL_SIZE + CELL_SIZE / 2;
      return this.add.rectangle(x, y, CELL_SIZE - 3, CELL_SIZE - 3, style.fill, style.alpha)
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
    this.boardFeedbackText.setText('デバッグ進行リセット');

    if (this.feedbackTimer) {
      this.feedbackTimer.remove(false);
    }

    this.feedbackTimer = this.time.delayedCall(1200, () => {
      this.boardFeedbackText.setText('');
    this.clearChainPopup();
    });
  }

  showUnlockEvents(unlockEvents) {
    if (unlockEvents.length === 0) {
      return;
    }

    this.bgm.duck(800, 0.4);
    this.sfx.playGodUnlock();
    const unlockEventsWithBombInfo = this.addBombsForUnlockEvents(unlockEvents);
    this.hud.showGodUnlocked(unlockEventsWithBombInfo);
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

  findClearResult() {
    const sameTypeGroups = this.matchResolver.findMatches();
    const canopicSets = this.canopusResolver.findCanopicSets();
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
      adjacentBrainBonusCell,
    };
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

  endGame() {
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

    const centerX = BOARD_ORIGIN_X + (BOARD_COLUMNS * CELL_SIZE) / 2;
    const centerY = BOARD_ORIGIN_Y + (BOARD_ROWS * CELL_SIZE) / 2;
    const panelWidth = Math.min(332, GAME_WIDTH - 56);
    const panelHeight = 290;
    this.gameOverOverlay = this.add.container(centerX, centerY).setDepth(25).setAlpha(0);
    const panel = this.add.rectangle(0, 0, panelWidth, panelHeight, 0x120806, 0.94)
      .setStrokeStyle(2, 0xd4af37, 0.82);
    const title = this.add.text(0, -108, 'GAME OVER', {
      fontFamily: 'Georgia, serif',
      fontSize: '34px',
      color: '#d4af37',
      fontStyle: 'bold',
      align: 'center',
      stroke: '#1a1006',
      strokeThickness: 4,
    }).setOrigin(0.5);
    const subtitle = this.add.text(0, -70, '魂は冥界へ沈んだ…', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: '#cdb98b',
      align: 'center',
      fontStyle: 'italic',
    }).setOrigin(0.5);
    const recordText = this.add.text(0, 8, [
      `最終スコア: ${this.score}`,
      `ベストスコア: ${highScoreResult.records.highScore}`,
      highScoreResult.isNewHighScore ? '新記録!' : '',
      `最大連鎖: ${this.bestChainThisRun}`,
      `到達Tier: ${this.maxTierThisRun}`,
      `解放した神: ${this.maxGodsUnlockedThisRun}/${TOTAL_GOD_COUNT}`,
    ].filter(Boolean).join('\n'), {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: '#eadfca',
      align: 'center',
      lineSpacing: 5,
      wordWrap: { width: panelWidth - 36 },
    }).setOrigin(0.5);
    if (highScoreResult.isNewHighScore) {
      recordText.setColor('#f4d77a');
      recordText.setFontStyle('bold');
    }
    const prompt = this.add.text(0, 112, 'Enter / Space で再挑戦', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: '#f2d783',
      align: 'center',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.gameOverOverlay.add([panel, title, subtitle, recordText, prompt]);
    this.tweens.add({
      targets: this.gameOverOverlay,
      alpha: 1,
      y: centerY - 6,
      duration: 650,
      ease: 'Sine.easeOut',
    });
    this.tweens.add({
      targets: panel,
      scaleX: { from: 0.98, to: 1.01 },
      scaleY: { from: 0.98, to: 1.01 },
      yoyo: true,
      repeat: -1,
      duration: 2400,
      ease: 'Sine.easeInOut',
    });
    panel.setInteractive({ useHandCursor: true });
    prompt.setInteractive({ useHandCursor: true });
    panel.on('pointerdown', () => this.restartGame());
    prompt.on('pointerdown', () => this.restartGame());
  }

  renderBoard() {
    this.clearBlockSprites();

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
      x: BOARD_ORIGIN_X + col * CELL_SIZE + CELL_SIZE / 2,
      y: BOARD_ORIGIN_Y + row * CELL_SIZE + CELL_SIZE / 2,
    };
  }

  createBlockSprite(x, y, type, alpha) {
    const container = this.add.container(x, y);
    const asset = getPieceAsset(type);

    container.add(this.createPieceShadow(alpha));
    container.add(this.createFallbackBlock(type, alpha));

    if (asset && this.textures.exists(asset.key)) {
      container.add(this.add.image(0, 0, asset.key)
        .setDisplaySize(CELL_SIZE - 10, CELL_SIZE - 10)
        .setAlpha(alpha));
    }

    return container;
  }

  createPieceShadow(alpha) {
    const shadow = this.add.ellipse(2, 4, CELL_SIZE - 8, CELL_SIZE - 8, 0x000000, 0.28 * alpha);
    const glow = this.add.rectangle(0, 0, CELL_SIZE - 7, CELL_SIZE - 7, 0xf4d77a, 0.08 * alpha);

    return [shadow, glow];
  }

  createFallbackBlock(type, alpha) {
    return this.add.rectangle(0, 0, CELL_SIZE - 8, CELL_SIZE - 8, PIECE_COLORS[type], 0.32 * alpha)
      .setStrokeStyle(1, 0xf6e3a1, 0.32);
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
    this.chainPopupText.setY(BOARD_ORIGIN_Y - 18);

    this.chainPopupTween = this.tweens.add({
      targets: this.chainPopupText,
      alpha: { from: 0, to: alphaByTier[visualTier] ?? 0.9 },
      y: { from: BOARD_ORIGIN_Y - 12, to: BOARD_ORIGIN_Y - 34 },
      scale: { from: 0.88, to: targetScale },
      ease: 'Sine.easeOut',
      duration: 220,
      yoyo: true,
      hold: 280,
      onComplete: () => {
        this.chainPopupText.setAlpha(0);
        this.chainPopupText.setScale(1);
        this.chainPopupText.setY(BOARD_ORIGIN_Y - 22);
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
    this.chainPopupText.setY(BOARD_ORIGIN_Y - 22);
  }

  clearBlockSprites() {
    this.blockSprites.forEach((sprite) => sprite.destroy());
    this.blockSprites = [];
  }
}

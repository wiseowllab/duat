import {
  BOARD_COLUMNS,
  BOARD_ROWS,
  BOARD_ORIGIN_X,
  BOARD_ORIGIN_Y,
  CELL_SIZE,
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
import { Hud } from '../ui/Hud.js';

const BOMB_AREA_FLASH_MS = 400;
const BOMB_AREA_FLASH_COLOR = 0xd4af37;
const BOMB_AREA_FLASH_STYLES = {
  brain_clear: { fill: 0x4b5dff, stroke: 0x9b62c9, alpha: 0.28 },
  knowledge_convert: { fill: 0x62f4ff, stroke: 0xf4d77a, alpha: 0.3 },
  protective_clear: { fill: 0xf4d77a, stroke: 0xffe6a0, alpha: 0.27 },
  war_burst: { fill: 0xc0392b, stroke: 0xf4d77a, alpha: 0.3 },
};
const SAME_TYPE_CLEAR_FLASH_MS = 320;
const CANOPIC_CLEAR_FLASH_MS = 420;
const SAME_TYPE_CLEAR_FLASH_COLOR = 0xf4d77a;
const CANOPIC_CLEAR_FLASH_COLOR = 0x62f4ff;
const CANOPIC_CLEAR_STROKE_COLOR = 0xf4d77a;
const BOARD_GRAVITY_STEP_MS = 55;

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  preload() {
    preloadPieceAssets(this);
    preloadCoffinAssets(this);
  }

  create() {
    this.board = new Board();
    this.gravity = new GravitySystem(this.board);
    this.matchResolver = new MatchResolver(this.board);
    this.canopusResolver = new CanopusResolver(this.board);
    this.scoreSystem = new ScoreSystem();
    this.coffinMeter = new CoffinMeter();
    this.bombSystem = new BombSystem();
    this.score = INITIAL_SCORE;
    this.chainCount = 0;
    this.level = INITIAL_LEVEL;
    this.activePiece = null;
    this.nextPairTypes = createRandomPairTypes();
    this.blockSprites = [];
    this.fallTimer = 0;
    this.lockTimer = 0;
    this.isGameOver = false;
    this.isDebugMode = false;
    this.feedbackTimer = null;
    this.bombAreaFlashSprites = [];
    this.bombAreaFlashTween = null;
    this.clearHighlightSprites = [];
    this.clearHighlightTween = null;
    this.isResolvingClears = false;

    this.createBackground();
    this.createInput();
    this.hud = new Hud(this, 370, 54);
    this.hud.updateScore(this.score);
    this.hud.updateChain(this.chainCount);
    this.hud.updateLevel(this.level);
    this.hud.setDebugMode(this.isDebugMode);
    this.hud.updateCoffin(this.coffinMeter.getState());
    this.hud.updateBombStock(this.bombSystem.getStock());
    this.hud.drawNext(this.nextPairTypes);

    this.spawnPiece();
  }

  update(_, delta) {
    if (this.isGameOver || this.isResolvingClears || !this.activePiece) {
      return;
    }

    const fallInterval = this.cursors.down.isDown ? SOFT_DROP_FALL_MS : NORMAL_FALL_MS;
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

    this.add.rectangle(280, 300, 560, 600, 0x090705);
    this.add.rectangle(280, 300, 520, 560, 0x17100a, 0.72)
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

  createInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyZ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyG = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.G);
    this.keyT = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.T);
    this.keyR = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    this.bombKeys = [
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE),
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO),
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE),
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FOUR),
    ];

    this.cursors.left.on('down', () => this.tryMove(-1, 0));
    this.cursors.right.on('down', () => this.tryMove(1, 0));
    this.cursors.up.on('down', () => this.tryRotate());
    this.keyZ.on('down', () => this.tryRotate());
    this.cursors.space.on('down', () => this.hardDrop());
    this.keyD.on('down', () => this.toggleDebugMode());
    this.keyG.on('down', (key, event) => this.handleDebugMeterKey(event));
    this.keyT.on('down', () => this.advanceDebugGod());
    this.keyR.on('down', () => this.resetDebugProgression());
    this.bombKeys.forEach((key, index) => {
      key.on('down', () => this.useBombSlot(index));
    });
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

  tryMove(deltaCol, deltaRow) {
    if (this.isGameOver || this.isResolvingClears || !this.activePiece) {
      return false;
    }

    const movedPiece = this.activePiece.moved(deltaCol, deltaRow);
    if (!this.board.canPlace(movedPiece)) {
      return false;
    }

    this.activePiece = movedPiece;
    this.lockTimer = 0;
    this.renderBoard();
    return true;
  }

  tryRotate() {
    if (this.isGameOver || this.isResolvingClears || !this.activePiece) {
      return;
    }

    const rotatedPiece = this.activePiece.rotated();
    if (this.board.canPlace(rotatedPiece)) {
      this.activePiece = rotatedPiece;
      this.lockTimer = 0;
      this.renderBoard();
    }
  }

  stepDown(delta) {
    if (!this.tryMove(0, 1)) {
      this.lockTimer += delta;
    }
  }

  hardDrop() {
    if (this.isGameOver || this.isResolvingClears || !this.activePiece) {
      return;
    }

    const distance = this.gravity.getDropDistance(this.activePiece);
    this.activePiece = this.activePiece.moved(0, distance);
    this.renderBoard();
    this.lockActivePiece();
  }

  async lockActivePiece() {
    if (!this.activePiece || this.isResolvingClears) {
      return;
    }

    const lockedSuccessfully = this.board.lockPiece(this.activePiece);
    this.activePiece = null;

    if (!lockedSuccessfully) {
      this.renderBoard();
      this.endGame();
      return;
    }

    try {
      await this.resolveBoardAfterLock();
    } catch (error) {
      console.error('Board resolution failed after lock:', error);
      this.renderBoard();
    }

    if (!this.isGameOver) {
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

      const earnedScore = this.scoreSystem.calculateCycleScore(clearResult, nextChain);
      const meterGain = this.scoreSystem.calculateCycleMeterPoints(clearResult, nextChain);
      this.score += earnedScore;
      unlockEvents.push(...this.coffinMeter.addPoints(meterGain));
      resolvedChains = nextChain;
      clearedCanopicSet = clearedCanopicSet || clearResult.clearTypes.has('canopic');
      clearedSameType = clearedSameType || clearResult.clearTypes.has('sameType');

      this.matchResolver.clearCells(clearResult.cellsToClear);
      await this.applyBoardGravityStepwise();
      nextChain += 1;
    }

    this.chainCount = resolvedChains;
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

  async useBombSlot(slotIndex) {
    if (this.isGameOver || this.isResolvingClears || !this.activePiece) {
      return;
    }

    const target = {
      col: this.activePiece.col,
      row: Math.max(0, this.activePiece.row),
    };
    const result = this.bombSystem.useBomb(slotIndex, target, this.board);

    if (!result) {
      return;
    }

    this.isResolvingClears = true;

    try {
      this.showBombAreaFlash(result.bomb.type, target);

      const clearedCells = this.matchResolver.clearCells(result.affectedCells);
      const convertedCells = this.convertBombCells(result.convertedCells);
      const changedCount = clearedCells.length + convertedCells.length;
      const earnedScore = changedCount * this.bombSystem.getScorePerPiece(result.bomb.type);
      const unlockEvents = this.coffinMeter.addPoints(Math.floor(earnedScore * 0.25));

      this.score += earnedScore;
      this.hud.updateScore(this.score);
      this.hud.updateCoffin(this.coffinMeter.getState());

      if (clearedCells.length > 0) {
        await this.applyBoardGravityStepwise();
      } else {
        this.renderBoard();
      }

      this.hud.updateBombStock(this.bombSystem.getStock());
      this.hud.showBombUsed(result.bomb, changedCount);
      this.showBombFeedback(result.bomb, changedCount);
      this.showUnlockEvents(unlockEvents);
      await this.resolveBoardClears();
    } finally {
      this.isResolvingClears = false;
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

  showBombAreaFlash(bombType, target) {
    this.clearBombAreaFlash();

    const cells = this.getBombAreaFlashCells(bombType, target);
    const style = this.getBombAreaFlashStyle(bombType);
    this.bombAreaFlashSprites = cells.map((cell) => {
      const x = BOARD_ORIGIN_X + cell.col * CELL_SIZE + CELL_SIZE / 2;
      const y = BOARD_ORIGIN_Y + cell.row * CELL_SIZE + CELL_SIZE / 2;
      return this.add.rectangle(x, y, CELL_SIZE - 3, CELL_SIZE - 3, style.fill, style.alpha)
        .setStrokeStyle(2, style.stroke, 0.84)
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
    const clampedTarget = this.bombSystem.clampTarget(target, this.board);
    const cellMap = new Map();

    this.bombSystem.getPatternCells(bombType, clampedTarget, this.board).forEach((cell) => {
      if (!this.board.isInsideColumn(cell.col) || !this.board.isVisibleRow(cell.row)) {
        return;
      }

      cellMap.set(`${cell.col},${cell.row}`, { col: cell.col, row: cell.row });
    });

    return [...cellMap.values()];
  }

  clearBombAreaFlash(stopTween = true) {
    if (stopTween && this.bombAreaFlashTween) {
      this.bombAreaFlashTween.remove();
      this.bombAreaFlashTween = null;
    }

    this.bombAreaFlashSprites.forEach((sprite) => sprite.destroy());
    this.bombAreaFlashSprites = [];
  }

  toggleDebugMode() {
    this.isDebugMode = !this.isDebugMode;
    this.hud.setDebugMode(this.isDebugMode);
  }

  handleDebugMeterKey(event) {
    if (!this.isDebugMode) {
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
    this.hud.updateCoffin(this.coffinMeter.getState());
    this.showUnlockEvents(unlockEvents);
  }

  fillDebugGod() {
    const unlockEvents = this.coffinMeter.fillCurrentGod();
    this.hud.updateCoffin(this.coffinMeter.getState());
    this.showUnlockEvents(unlockEvents);
  }

  advanceDebugGod() {
    if (!this.isDebugMode) {
      return;
    }

    this.fillDebugGod();
  }

  resetDebugProgression() {
    if (!this.isDebugMode) {
      return;
    }

    this.coffinMeter.reset();
    this.bombSystem.reset();
    this.hud.updateCoffin(this.coffinMeter.getState());
    this.hud.updateBombStock(this.bombSystem.getStock());
    this.boardFeedbackText.setText('DEBUG PROGRESSION RESET');

    if (this.feedbackTimer) {
      this.feedbackTimer.remove(false);
    }

    this.feedbackTimer = this.time.delayedCall(1200, () => {
      this.boardFeedbackText.setText('');
    });
  }

  showUnlockEvents(unlockEvents) {
    if (unlockEvents.length === 0) {
      return;
    }

    this.addBombsForUnlockEvents(unlockEvents);
    this.showGodUnlockFeedback(unlockEvents[unlockEvents.length - 1]);
    this.hud.showGodUnlocked(unlockEvents);
  }

  addBombsForUnlockEvents(unlockEvents) {
    unlockEvents.forEach((unlockEvent) => {
      this.bombSystem.addBombForGod(unlockEvent.god);
    });
    this.hud.updateBombStock(this.bombSystem.getStock());
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

  endGame() {
    this.isGameOver = true;
    this.activePiece = null;
    this.hud.showGameOver();
    this.add.text(BOARD_ORIGIN_X + 22, BOARD_ORIGIN_Y + 215, 'GAME OVER', {
      fontFamily: 'Georgia, serif',
      fontSize: '28px',
      color: '#ff7b7b',
      fontStyle: 'bold',
    });
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

  showGodUnlockFeedback(unlockEvent) {
    const message = unlockEvent.isComplete
      ? `GOD UNLOCKED!\n${unlockEvent.god.name}\nDUAT COMPLETE`
      : `GOD UNLOCKED!\n${unlockEvent.god.name}`;

    this.boardFeedbackText.setText(message);
    this.boardFeedbackText.setAlpha(1);

    if (this.feedbackTimer) {
      this.feedbackTimer.remove(false);
    }

    this.feedbackTimer = this.time.delayedCall(1800, () => {
      this.boardFeedbackText.setText('');
    });
  }

  showBombFeedback(bomb, affectedCount) {
    this.boardFeedbackText.setText(`BOMB!\n${bomb.godName} ${bomb.name}\n${affectedCount} affected`);
    this.boardFeedbackText.setAlpha(1);

    if (this.feedbackTimer) {
      this.feedbackTimer.remove(false);
    }

    this.feedbackTimer = this.time.delayedCall(1000, () => {
      this.boardFeedbackText.setText('');
    });
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

    this.boardFeedbackText.setText(messages.join('\n'));
    this.boardFeedbackText.setAlpha(1);

    if (this.feedbackTimer) {
      this.feedbackTimer.remove(false);
    }

    this.feedbackTimer = this.time.delayedCall(1200, () => {
      this.boardFeedbackText.setText('');
    });
  }

  clearBlockSprites() {
    this.blockSprites.forEach((sprite) => sprite.destroy());
    this.blockSprites = [];
  }
}

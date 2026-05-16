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
import { Board } from '../core/Board.js';
import { Piece } from '../core/Piece.js';
import { GravitySystem } from '../core/GravitySystem.js';
import { MatchResolver } from '../core/MatchResolver.js';
import { CanopusResolver } from '../core/CanopusResolver.js';
import { ScoreSystem } from '../core/ScoreSystem.js';
import { CoffinMeter } from '../core/CoffinMeter.js';
import { Hud } from '../ui/Hud.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  preload() {
    preloadPieceAssets(this);
  }

  create() {
    this.board = new Board();
    this.gravity = new GravitySystem(this.board);
    this.matchResolver = new MatchResolver(this.board);
    this.canopusResolver = new CanopusResolver(this.board);
    this.scoreSystem = new ScoreSystem();
    this.coffinMeter = new CoffinMeter();
    this.score = INITIAL_SCORE;
    this.chainCount = 0;
    this.level = INITIAL_LEVEL;
    this.activePiece = null;
    this.nextPairTypes = createRandomPairTypes();
    this.blockSprites = [];
    this.fallTimer = 0;
    this.lockTimer = 0;
    this.isGameOver = false;
    this.feedbackTimer = null;

    this.createBackground();
    this.createInput();
    this.hud = new Hud(this, 370, 54);
    this.hud.updateScore(this.score);
    this.hud.updateChain(this.chainCount);
    this.hud.updateLevel(this.level);
    this.hud.updateCoffin(this.coffinMeter.getState());
    this.hud.drawNext(this.nextPairTypes);

    this.spawnPiece();
  }

  update(_, delta) {
    if (this.isGameOver || !this.activePiece) {
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

    this.cursors.left.on('down', () => this.tryMove(-1, 0));
    this.cursors.right.on('down', () => this.tryMove(1, 0));
    this.cursors.up.on('down', () => this.tryRotate());
    this.keyZ.on('down', () => this.tryRotate());
    this.cursors.space.on('down', () => this.hardDrop());
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
    if (this.isGameOver || !this.activePiece) {
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
    if (this.isGameOver || !this.activePiece) {
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
    if (this.isGameOver || !this.activePiece) {
      return;
    }

    const distance = this.gravity.getDropDistance(this.activePiece);
    this.activePiece = this.activePiece.moved(0, distance);
    this.renderBoard();
    this.lockActivePiece();
  }

  lockActivePiece() {
    if (!this.activePiece) {
      return;
    }

    const lockedSuccessfully = this.board.lockPiece(this.activePiece);
    this.activePiece = null;

    if (!lockedSuccessfully) {
      this.renderBoard();
      this.endGame();
      return;
    }

    this.resolveBoardAfterLock();
    this.spawnPiece();
  }

  resolveBoardAfterLock() {
    this.gravity.applyBoardGravity();

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

      const earnedScore = this.scoreSystem.calculateCycleScore(clearResult, nextChain);
      const meterGain = this.scoreSystem.calculateCycleMeterPoints(clearResult, nextChain);
      this.score += earnedScore;
      unlockEvents.push(...this.coffinMeter.addPoints(meterGain));
      resolvedChains = nextChain;
      clearedCanopicSet = clearedCanopicSet || clearResult.clearTypes.has('canopic');
      clearedSameType = clearedSameType || clearResult.clearTypes.has('sameType');

      this.matchResolver.clearCells(clearResult.cellsToClear);
      this.gravity.applyBoardGravity();
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

    if (unlockEvents.length > 0) {
      this.showGodUnlockFeedback(unlockEvents[unlockEvents.length - 1]);
      this.hud.showGodUnlocked(unlockEvents);
    }

    this.renderBoard();
  }

  findClearResult() {
    const sameTypeGroups = this.matchResolver.findMatches();
    const canopicSets = this.canopusResolver.findCanopicSets();
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

    return {
      cellsToClear: [...cellMap.values()],
      clearTypes,
      sameTypeGroups,
      canopicSets,
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
    const x = BOARD_ORIGIN_X + col * CELL_SIZE + CELL_SIZE / 2;
    const y = BOARD_ORIGIN_Y + row * CELL_SIZE + CELL_SIZE / 2;
    const asset = getPieceAsset(type);

    this.drawPieceShadow(x, y, alpha);
    this.drawFallbackBlock(x, y, type, alpha);

    if (!asset || !this.textures.exists(asset.key)) {
      return;
    }

    const sprite = this.add.image(x, y, asset.key)
      .setDisplaySize(CELL_SIZE - 10, CELL_SIZE - 10)
      .setAlpha(alpha);

    this.blockSprites.push(sprite);
  }

  drawPieceShadow(x, y, alpha) {
    const shadow = this.add.ellipse(x + 2, y + 4, CELL_SIZE - 8, CELL_SIZE - 8, 0x000000, 0.28 * alpha);
    const glow = this.add.rectangle(x, y, CELL_SIZE - 7, CELL_SIZE - 7, 0xf4d77a, 0.08 * alpha);

    this.blockSprites.push(shadow, glow);
  }

  drawFallbackBlock(x, y, type, alpha) {
    const rect = this.add.rectangle(x, y, CELL_SIZE - 8, CELL_SIZE - 8, PIECE_COLORS[type], 0.32 * alpha)
      .setStrokeStyle(1, 0xf6e3a1, 0.32);

    this.blockSprites.push(rect);
    return rect;
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

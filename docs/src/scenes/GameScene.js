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
import { createRandomPairTypes, PIECE_COLORS } from '../data/pieces.js';
import { Board } from '../core/Board.js';
import { Piece } from '../core/Piece.js';
import { GravitySystem } from '../core/GravitySystem.js';
import { Hud } from '../ui/Hud.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    this.board = new Board();
    this.gravity = new GravitySystem(this.board);
    this.score = INITIAL_SCORE;
    this.level = INITIAL_LEVEL;
    this.activePiece = null;
    this.nextPairTypes = createRandomPairTypes();
    this.blockSprites = [];
    this.fallTimer = 0;
    this.lockTimer = 0;
    this.isGameOver = false;

    this.createBackground();
    this.createInput();
    this.hud = new Hud(this, 370, 54);
    this.hud.updateScore(this.score);
    this.hud.updateLevel(this.level);
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
    this.cameras.main.setBackgroundColor('#111827');

    this.add.rectangle(
      BOARD_ORIGIN_X + (BOARD_COLUMNS * CELL_SIZE) / 2,
      BOARD_ORIGIN_Y + (BOARD_ROWS * CELL_SIZE) / 2,
      BOARD_COLUMNS * CELL_SIZE + 18,
      BOARD_ROWS * CELL_SIZE + 18,
      0x2a1b10,
    ).setStrokeStyle(3, 0xd4af37);

    this.gridGraphics = this.add.graphics();
    this.gridGraphics.lineStyle(1, 0x675235, 0.8);

    for (let col = 0; col <= BOARD_COLUMNS; col += 1) {
      const x = BOARD_ORIGIN_X + col * CELL_SIZE;
      this.gridGraphics.lineBetween(x, BOARD_ORIGIN_Y, x, BOARD_ORIGIN_Y + BOARD_ROWS * CELL_SIZE);
    }

    for (let row = 0; row <= BOARD_ROWS; row += 1) {
      const y = BOARD_ORIGIN_Y + row * CELL_SIZE;
      this.gridGraphics.lineBetween(BOARD_ORIGIN_X, y, BOARD_ORIGIN_X + BOARD_COLUMNS * CELL_SIZE, y);
    }
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

    this.spawnPiece();
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
    const rect = this.add.rectangle(x, y, CELL_SIZE - 4, CELL_SIZE - 4, PIECE_COLORS[type], alpha)
      .setStrokeStyle(2, 0xf6e3a1);
    const shine = this.add.rectangle(x - 8, y - 9, 10, 6, 0xffffff, 0.18);

    this.blockSprites.push(rect, shine);
  }

  clearBlockSprites() {
    this.blockSprites.forEach((sprite) => sprite.destroy());
    this.blockSprites = [];
  }
}

import { BOARD_COLUMNS, BOARD_ROWS } from '../data/constants.js';

export class Board {
  constructor(columns = BOARD_COLUMNS, rows = BOARD_ROWS) {
    this.columns = columns;
    this.rows = rows;
    this.cells = this.createEmptyCells();
  }

  createEmptyCells() {
    return Array.from({ length: this.rows }, () => Array(this.columns).fill(null));
  }

  reset() {
    this.cells = this.createEmptyCells();
  }

  isInsideColumn(col) {
    return col >= 0 && col < this.columns;
  }

  isVisibleRow(row) {
    return row >= 0 && row < this.rows;
  }

  getCell(col, row) {
    if (!this.isInsideColumn(col) || !this.isVisibleRow(row)) {
      return null;
    }

    return this.cells[row][col];
  }

  setCell(col, row, type) {
    if (this.isInsideColumn(col) && this.isVisibleRow(row)) {
      this.cells[row][col] = type;
    }
  }

  clearCell(col, row) {
    this.setCell(col, row, null);
  }

  isEmpty(col, row) {
    if (!this.isInsideColumn(col) || row >= this.rows) {
      return false;
    }

    if (row < 0) {
      return true;
    }

    return this.cells[row][col] === null;
  }


  isCompletelyEmpty() {
    for (let row = 0; row < this.rows; row += 1) {
      for (let col = 0; col < this.columns; col += 1) {
        if (this.cells[row][col] !== null) {
          return false;
        }
      }
    }

    return true;
  }

  canPlace(piece) {
    return piece.getCells().every((cell) => this.isEmpty(cell.col, cell.row));
  }

  lockPiece(piece) {
    let lockedAboveBoard = false;

    for (const cell of piece.getCells()) {
      if (cell.row < 0) {
        lockedAboveBoard = true;
        continue;
      }

      if (!this.isVisibleRow(cell.row) || !this.isInsideColumn(cell.col)) {
        return false;
      }

      this.cells[cell.row][cell.col] = cell.type;
    }

    return !lockedAboveBoard;
  }
}

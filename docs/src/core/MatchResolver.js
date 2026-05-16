import { BRAIN_TYPE } from '../data/pieces.js';

const MATCH_SIZE = 4;
const ORTHOGONAL_DIRECTIONS = [
  { col: 0, row: -1 },
  { col: 1, row: 0 },
  { col: 0, row: 1 },
  { col: -1, row: 0 },
];

export class MatchResolver {
  constructor(board) {
    this.board = board;
  }

  findMatches() {
    const visited = this.createVisitedGrid();
    const matches = [];

    for (let row = 0; row < this.board.rows; row += 1) {
      for (let col = 0; col < this.board.columns; col += 1) {
        if (visited[row][col] || !this.canStartMatch(this.board.cells[row][col])) {
          continue;
        }

        const group = this.findConnectedGroup(col, row, visited);
        if (group.length >= MATCH_SIZE) {
          matches.push(group);
        }
      }
    }

    return matches;
  }

  clearMatches(matches) {
    return this.clearCells(matches.flat());
  }

  clearCells(cells) {
    const clearedCells = [];
    const clearedKeys = new Set();

    cells.forEach((cell) => {
      const key = this.createCellKey(cell);
      if (clearedKeys.has(key)) {
        return;
      }

      this.board.clearCell(cell.col, cell.row);
      clearedCells.push(cell);
      clearedKeys.add(key);
    });

    return clearedCells;
  }

  createCellKey(cell) {
    return `${cell.col},${cell.row}`;
  }

  createVisitedGrid() {
    return Array.from({ length: this.board.rows }, () => Array(this.board.columns).fill(false));
  }

  findConnectedGroup(startCol, startRow, visited) {
    const type = this.board.cells[startRow][startCol];
    const group = [];
    const queue = [{ col: startCol, row: startRow }];
    visited[startRow][startCol] = true;

    while (queue.length > 0) {
      const cell = queue.shift();
      group.push({ ...cell, type });

      ORTHOGONAL_DIRECTIONS.forEach((direction) => {
        const nextCol = cell.col + direction.col;
        const nextRow = cell.row + direction.row;

        if (!this.canVisit(nextCol, nextRow, type, visited)) {
          return;
        }

        visited[nextRow][nextCol] = true;
        queue.push({ col: nextCol, row: nextRow });
      });
    }

    return group;
  }

  canStartMatch(type) {
    return Boolean(type) && type !== BRAIN_TYPE;
  }

  canVisit(col, row, type, visited) {
    return this.board.isInsideColumn(col)
      && this.board.isVisibleRow(row)
      && !visited[row][col]
      && this.board.cells[row][col] === type;
  }
}

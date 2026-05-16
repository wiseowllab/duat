import { CANOPIC_ORGAN_TYPES, HEART_TYPE } from '../data/pieces.js';

const ORTHOGONAL_DIRECTIONS = [
  { col: 0, row: -1 },
  { col: 1, row: 0 },
  { col: 0, row: 1 },
  { col: -1, row: 0 },
];

export class CanopusResolver {
  constructor(board) {
    this.board = board;
  }

  findCanopicSets() {
    const visited = this.createVisitedGrid();
    const canopicSets = [];

    for (let row = 0; row < this.board.rows; row += 1) {
      for (let col = 0; col < this.board.columns; col += 1) {
        if (visited[row][col] || !this.canJoinCanopicGroup(this.board.cells[row][col])) {
          continue;
        }

        const group = this.findConnectedCanopicGroup(col, row, visited);
        if (this.isCompleteCanopicSet(group)) {
          canopicSets.push(group);
        }
      }
    }

    return canopicSets;
  }

  createVisitedGrid() {
    return Array.from({ length: this.board.rows }, () => Array(this.board.columns).fill(false));
  }

  findConnectedCanopicGroup(startCol, startRow, visited) {
    const group = [];
    const queue = [{ col: startCol, row: startRow }];
    visited[startRow][startCol] = true;

    while (queue.length > 0) {
      const cell = queue.shift();
      const type = this.board.getCell(cell.col, cell.row);
      group.push({ ...cell, type });

      ORTHOGONAL_DIRECTIONS.forEach((direction) => {
        const nextCol = cell.col + direction.col;
        const nextRow = cell.row + direction.row;

        if (!this.canVisit(nextCol, nextRow, visited)) {
          return;
        }

        visited[nextRow][nextCol] = true;
        queue.push({ col: nextCol, row: nextRow });
      });
    }

    return group;
  }

  canVisit(col, row, visited) {
    return this.board.isInsideColumn(col)
      && this.board.isVisibleRow(row)
      && !visited[row][col]
      && this.canJoinCanopicGroup(this.board.cells[row][col]);
  }

  canJoinCanopicGroup(type) {
    return CANOPIC_ORGAN_TYPES.includes(type) || type === HEART_TYPE;
  }

  isCompleteCanopicSet(group) {
    const presentOrgans = new Set(
      group
        .filter((cell) => CANOPIC_ORGAN_TYPES.includes(cell.type))
        .map((cell) => cell.type),
    );
    const missingOrganCount = CANOPIC_ORGAN_TYPES.length - presentOrgans.size;
    const hasHeart = group.some((cell) => cell.type === HEART_TYPE);

    return missingOrganCount === 0 || (missingOrganCount === 1 && hasHeart);
  }
}

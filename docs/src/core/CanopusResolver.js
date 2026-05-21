import { BRAIN_TYPE, CANOPIC_ORGAN_TYPES, HEART_TYPE } from '../data/pieces.js';

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
        const selectedSet = this.selectCanopicSetCells(group);

        if (selectedSet) {
          canopicSets.push(selectedSet);
        }
      }
    }

    return canopicSets;
  }


  findAdjacentBrainBonusCell(canopicSets) {
    if (!canopicSets || canopicSets.length === 0) {
      return null;
    }

    const canopicCellKeys = new Set();
    canopicSets.forEach((group) => {
      group.forEach((cell) => {
        canopicCellKeys.add(this.createCellKey(cell.col, cell.row));
      });
    });

    const candidates = new Map();

    canopicCellKeys.forEach((key) => {
      const [col, row] = this.parseCellKey(key);

      ORTHOGONAL_DIRECTIONS.forEach((direction) => {
        const nextCol = col + direction.col;
        const nextRow = row + direction.row;

        if (!this.isBrainCell(nextCol, nextRow)) {
          return;
        }

        const candidateKey = this.createCellKey(nextCol, nextRow);
        const candidate = candidates.get(candidateKey) ?? {
          col: nextCol,
          row: nextRow,
          type: BRAIN_TYPE,
          adjacentCanopicCount: 0,
        };

        candidate.adjacentCanopicCount += 1;
        candidates.set(candidateKey, candidate);
      });
    });

    return [...candidates.values()].sort((a, b) => (
      b.adjacentCanopicCount - a.adjacentCanopicCount
      || b.row - a.row
      || a.col - b.col
    ))[0] ?? null;
  }

  isBrainCell(col, row) {
    return this.board.isInsideColumn(col)
      && this.board.isVisibleRow(row)
      && this.board.getCell(col, row) === BRAIN_TYPE;
  }

  createCellKey(col, row) {
    return `${col},${row}`;
  }

  parseCellKey(key) {
    return key.split(',').map(Number);
  }

  createVisitedGrid() {
    return Array.from({ length: this.board.rows }, () => Array(this.board.columns).fill(false));
  }

  findConnectedCanopicGroup(startCol, startRow, visited) {
    // A connected canopic group is used only for detection.
    // When a set is found, only one selected 4-cell set is cleared
    // (plus optional adjacent-brain bonus handled separately).
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

  selectCanopicSetCells(group) {
    const cellsByType = this.createCellsByType(group);
    const hasPureSet = CANOPIC_ORGAN_TYPES.every((type) => cellsByType.get(type).length > 0);

    if (hasPureSet) {
      return CANOPIC_ORGAN_TYPES.map((type) => cellsByType.get(type)[0]);
    }

    const missingTypes = CANOPIC_ORGAN_TYPES.filter((type) => cellsByType.get(type).length === 0);
    const canUseHeartSubstitution = missingTypes.length === 1 && cellsByType.get(HEART_TYPE).length > 0;

    if (!canUseHeartSubstitution) {
      return null;
    }

    const selected = CANOPIC_ORGAN_TYPES
      .filter((type) => type !== missingTypes[0])
      .map((type) => cellsByType.get(type)[0]);
    selected.push(cellsByType.get(HEART_TYPE)[0]);

    return selected;
  }

  createCellsByType(group) {
    const map = new Map([...CANOPIC_ORGAN_TYPES, HEART_TYPE].map((type) => [type, []]));
    const orderedGroup = [...group].sort((a, b) => b.row - a.row || a.col - b.col);

    orderedGroup.forEach((cell) => {
      if (map.has(cell.type)) {
        map.get(cell.type).push(cell);
      }
    });

    return map;
  }
}

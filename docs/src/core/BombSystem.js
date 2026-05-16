import { BRAIN_TYPE } from '../data/pieces.js';

export const MAX_BOMB_STOCK = 4;

export const TIER_1_BOMBS = {
  vertical_clear: {
    type: 'vertical_clear',
    name: 'Vertical',
    description: 'Clear the target column.',
  },
  horizontal_clear: {
    type: 'horizontal_clear',
    name: 'Horizontal',
    description: 'Clear the target row.',
  },
  cross_clear: {
    type: 'cross_clear',
    name: 'Cross',
    description: 'Clear the target row and column.',
  },
  surround_clear: {
    type: 'surround_clear',
    name: 'Surround',
    description: 'Clear a 3x3 area around the target cell.',
  },
};

export class BombSystem {
  constructor(maxStock = MAX_BOMB_STOCK) {
    this.maxStock = maxStock;
    this.stock = [];
  }

  addBombForGod(god) {
    if (!god || !this.isSupportedBombType(god.futureBombType) || this.isFull()) {
      return null;
    }

    const bomb = {
      type: god.futureBombType,
      name: TIER_1_BOMBS[god.futureBombType].name,
      godId: god.id,
      godName: god.name,
    };

    this.stock.push(bomb);
    return { ...bomb };
  }

  useBomb(slotIndex, target, board) {
    if (!this.hasBombAt(slotIndex) || !target || !board) {
      return null;
    }

    const [bomb] = this.stock.splice(slotIndex, 1);

    return {
      bomb: { ...bomb },
      affectedCells: this.getAffectedCells(bomb.type, target, board),
    };
  }

  getAffectedCells(type, target, board) {
    if (!this.isSupportedBombType(type) || !target || !board) {
      return [];
    }

    const clampedTarget = this.clampTarget(target, board);
    const cellMap = new Map();

    this.getPatternCells(type, clampedTarget, board).forEach((cell) => {
      if (!board.isInsideColumn(cell.col) || !board.isVisibleRow(cell.row)) {
        return;
      }

      const cellType = board.getCell(cell.col, cell.row);
      if (!cellType || cellType === BRAIN_TYPE) {
        return;
      }

      cellMap.set(`${cell.col},${cell.row}`, { col: cell.col, row: cell.row, type: cellType });
    });

    return [...cellMap.values()];
  }

  getPatternCells(type, target, board) {
    if (type === 'vertical_clear') {
      return Array.from({ length: board.rows }, (_, row) => ({ col: target.col, row }));
    }

    if (type === 'horizontal_clear') {
      return Array.from({ length: board.columns }, (_, col) => ({ col, row: target.row }));
    }

    if (type === 'cross_clear') {
      return [
        ...this.getPatternCells('vertical_clear', target, board),
        ...this.getPatternCells('horizontal_clear', target, board),
      ];
    }

    if (type === 'surround_clear') {
      const cells = [];
      for (let row = target.row - 1; row <= target.row + 1; row += 1) {
        for (let col = target.col - 1; col <= target.col + 1; col += 1) {
          cells.push({ col, row });
        }
      }
      return cells;
    }

    return [];
  }

  clampTarget(target, board) {
    return {
      col: Math.min(Math.max(target.col, 0), board.columns - 1),
      row: Math.min(Math.max(target.row, 0), board.rows - 1),
    };
  }

  hasBombAt(slotIndex) {
    return Number.isInteger(slotIndex) && slotIndex >= 0 && slotIndex < this.stock.length;
  }

  isSupportedBombType(type) {
    return Boolean(TIER_1_BOMBS[type]);
  }

  isFull() {
    return this.stock.length >= this.maxStock;
  }

  reset() {
    this.stock = [];
  }

  getStock() {
    return this.stock.map((bomb) => ({ ...bomb }));
  }
}

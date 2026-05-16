import { BRAIN_TYPE, CANOPIC_ORGAN_TYPES, HEART_TYPE } from '../data/pieces.js';

export const MAX_BOMB_STOCK = 4;

export const TIER_1_BOMBS = {
  vertical_clear: {
    type: 'vertical_clear',
    name: 'Vertical',
    description: 'Clear the target column.',
    scorePerPiece: 25,
  },
  horizontal_clear: {
    type: 'horizontal_clear',
    name: 'Horizontal',
    description: 'Clear the target row.',
    scorePerPiece: 25,
  },
  cross_clear: {
    type: 'cross_clear',
    name: 'Cross',
    description: 'Clear the target row and column.',
    scorePerPiece: 25,
  },
  surround_clear: {
    type: 'surround_clear',
    name: 'Surround',
    description: 'Clear a 3x3 area around the target cell.',
    scorePerPiece: 25,
  },
};

export const TIER_2_BOMBS = {
  brain_clear: {
    type: 'brain_clear',
    name: 'Brain Clear',
    description: 'Clear brain pieces in the target row and column.',
    scorePerPiece: 50,
  },
  knowledge_convert: {
    type: 'knowledge_convert',
    name: 'Convert',
    description: 'Convert up to four brain pieces in a 3x3 area into hearts.',
    scorePerPiece: 25,
  },
  protective_clear: {
    type: 'protective_clear',
    name: 'Protect',
    description: 'Clear a 3x3 area, including brain pieces.',
    scorePerPiece: 35,
  },
  war_burst: {
    type: 'war_burst',
    name: 'Burst',
    description: 'Clear a 5-cell diamond, including brain pieces.',
    scorePerPiece: 40,
  },
};

export const TIER_3_BOMBS = {
  triple_column_clear: {
    type: 'triple_column_clear',
    name: 'Triple Column',
    description: 'Clear the target column and its immediate neighboring columns.',
    scorePerPiece: 45,
  },
  piece_transform: {
    type: 'piece_transform',
    name: 'Transform',
    description: 'Transform brain pieces in a 5x5 area into hearts, or restore nearby organs if no brains are present.',
    scorePerPiece: 35,
  },
  half_board_reset: {
    type: 'half_board_reset',
    name: 'Half Reset',
    description: 'Clear the left or right half of the board based on the target column.',
    scorePerPiece: 30,
  },
  chaos_clear: {
    type: 'chaos_clear',
    name: 'Chaos',
    description: 'Clear up to eight occupied cells near the target using controlled chaos.',
    scorePerPiece: 50,
  },
};

export const TIER_4_BOMBS = {
  full_board_clear: {
    type: 'full_board_clear',
    name: 'Full Clear',
    description: 'Clear the entire board, including brain pieces.',
    scorePerPiece: 40,
    bonusScore: 0,
  },
  maximum_coffin_burst: {
    type: 'maximum_coffin_burst',
    name: 'Max Burst',
    description: 'Clear the entire board, including brain pieces, and award a final-stage bonus.',
    scorePerPiece: 60,
    bonusScore: 1000,
  },
};

export const SUPPORTED_BOMBS = {
  ...TIER_1_BOMBS,
  ...TIER_2_BOMBS,
  ...TIER_3_BOMBS,
  ...TIER_4_BOMBS,
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
      name: SUPPORTED_BOMBS[god.futureBombType].name,
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
      convertedCells: this.getConvertedCells(bomb.type, target, board),
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
      if (!this.canClearCellType(type, cellType)) {
        return;
      }

      cellMap.set(`${cell.col},${cell.row}`, { col: cell.col, row: cell.row, type: cellType });
    });

    return [...cellMap.values()];
  }

  getConvertedCells(type, target, board) {
    if ((type !== 'knowledge_convert' && type !== 'piece_transform') || !target || !board) {
      return [];
    }

    const clampedTarget = this.clampTarget(target, board);
    const areaCells = this.getPatternCells(type, clampedTarget, board)
      .filter((cell) => board.isInsideColumn(cell.col) && board.isVisibleRow(cell.row))
      .map((cell) => ({ ...cell, type: board.getCell(cell.col, cell.row) }))
      .filter((cell) => Boolean(cell.type));

    if (type === 'piece_transform') {
      return this.getPieceTransformCells(areaCells);
    }

    const brainCells = areaCells.filter((cell) => cell.type === BRAIN_TYPE).slice(0, 4);

    if (brainCells.length > 0) {
      return brainCells.map((cell) => ({ ...cell, toType: HEART_TYPE }));
    }

    const fallbackCells = areaCells.filter((cell) => cell.type !== BRAIN_TYPE);
    if (fallbackCells.length === 0) {
      return [];
    }

    const randomIndex = Math.floor(Math.random() * fallbackCells.length);
    return [{ ...fallbackCells[randomIndex], toType: HEART_TYPE }];
  }

  getPieceTransformCells(areaCells) {
    const brainCells = areaCells.filter((cell) => cell.type === BRAIN_TYPE);

    if (brainCells.length > 0) {
      return brainCells.map((cell) => ({ ...cell, toType: HEART_TYPE }));
    }

    return this.shuffleCells(areaCells.filter((cell) => CANOPIC_ORGAN_TYPES.includes(cell.type)))
      .slice(0, 3)
      .map((cell) => ({ ...cell, toType: HEART_TYPE }));
  }

  shuffleCells(cells) {
    const shuffledCells = [...cells];

    for (let index = shuffledCells.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [shuffledCells[index], shuffledCells[swapIndex]] = [shuffledCells[swapIndex], shuffledCells[index]];
    }

    return shuffledCells;
  }

  getPatternCells(type, target, board) {
    if (type === 'vertical_clear') {
      return Array.from({ length: board.rows }, (_, row) => ({ col: target.col, row }));
    }

    if (type === 'full_board_clear' || type === 'maximum_coffin_burst') {
      return this.getFullBoardCells(board);
    }

    if (type === 'triple_column_clear') {
      return this.getTripleColumnCells(target, board);
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
      return this.getSquareCells(target);
    }

    if (type === 'brain_clear') {
      return this.getPatternCells('cross_clear', target, board);
    }

    if (type === 'knowledge_convert' || type === 'protective_clear') {
      return this.getSquareCells(target);
    }

    if (type === 'piece_transform') {
      return this.getSquareCells(target, 2);
    }

    if (type === 'half_board_reset') {
      return this.getHalfBoardCells(target, board);
    }

    if (type === 'chaos_clear') {
      return this.getChaosCells(target, board);
    }

    if (type === 'war_burst') {
      return [
        { col: target.col, row: target.row },
        { col: target.col, row: target.row - 1 },
        { col: target.col, row: target.row + 1 },
        { col: target.col - 1, row: target.row },
        { col: target.col + 1, row: target.row },
      ];
    }

    return [];
  }

  getSquareCells(target, radius = 1) {
    const cells = [];
    for (let row = target.row - radius; row <= target.row + radius; row += 1) {
      for (let col = target.col - radius; col <= target.col + radius; col += 1) {
        cells.push({ col, row });
      }
    }
    return cells;
  }

  getTripleColumnCells(target, board) {
    const cells = [];
    for (let col = target.col - 1; col <= target.col + 1; col += 1) {
      if (!board.isInsideColumn(col)) {
        continue;
      }

      for (let row = 0; row < board.rows; row += 1) {
        cells.push({ col, row });
      }
    }
    return cells;
  }

  getFullBoardCells(board) {
    const cells = [];

    for (let row = 0; row < board.rows; row += 1) {
      for (let col = 0; col < board.columns; col += 1) {
        cells.push({ col, row });
      }
    }

    return cells;
  }

  getHalfBoardCells(target, board) {
    const midpoint = Math.floor(board.columns / 2);
    const startCol = target.col < midpoint ? 0 : midpoint;
    const endCol = target.col < midpoint ? midpoint - 1 : board.columns - 1;
    const cells = [];

    for (let col = startCol; col <= endCol; col += 1) {
      for (let row = 0; row < board.rows; row += 1) {
        cells.push({ col, row });
      }
    }

    return cells;
  }

  getChaosCells(target, board) {
    const cells = [];

    for (let row = 0; row < board.rows; row += 1) {
      for (let col = 0; col < board.columns; col += 1) {
        const distance = Math.abs(col - target.col) + Math.abs(row - target.row);
        if (distance <= 3 && board.getCell(col, row)) {
          cells.push({ col, row, distance });
        }
      }
    }

    return cells
      .sort((a, b) => a.distance - b.distance || a.row - b.row || a.col - b.col)
      .slice(0, 8)
      .map(({ col, row }) => ({ col, row }));
  }

  canClearCellType(type, cellType) {
    if (!cellType || type === 'knowledge_convert' || type === 'piece_transform') {
      return false;
    }

    if (type === 'brain_clear') {
      return cellType === BRAIN_TYPE;
    }

    if (this.canClearBrain(type)) {
      return true;
    }

    return cellType !== BRAIN_TYPE;
  }

  canClearBrain(type) {
    return [
      'protective_clear',
      'war_burst',
      'triple_column_clear',
      'half_board_reset',
      'chaos_clear',
      'full_board_clear',
      'maximum_coffin_burst',
    ].includes(type);
  }

  getScorePerPiece(type) {
    return SUPPORTED_BOMBS[type]?.scorePerPiece ?? 0;
  }

  getBonusScore(type) {
    return SUPPORTED_BOMBS[type]?.bonusScore ?? 0;
  }

  isFinalStageBomb(type) {
    return type === 'maximum_coffin_burst';
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
    return Boolean(SUPPORTED_BOMBS[type]);
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

import { BRAIN_TYPE, CANOPIC_ORGAN_TYPES, HEART_TYPE } from '../data/pieces.js';

const ORTHOGONAL_DIRECTIONS = [
  { col: 0, row: -1 },
  { col: 1, row: 0 },
  { col: 0, row: 1 },
  { col: -1, row: 0 },
];

const REQUIRED_ORGAN_SET = new Set(CANOPIC_ORGAN_TYPES);

export class CanopusResolver {
  constructor(board) {
    this.board = board;
  }

  findCanopicSets() {
    const selectedSets = [];
    const usedKeys = new Set();

    this.collectTwoByTwoCandidates().forEach((candidate) => {
      if (candidate.cells.some((cell) => usedKeys.has(this.createCellKey(cell.col, cell.row)))) {
        return;
      }

      candidate.cells.forEach((cell) => {
        usedKeys.add(this.createCellKey(cell.col, cell.row));
      });
      selectedSets.push(candidate.cells);
    });

    return selectedSets;
  }

  isPureCanopicSet(cells) {
    return this.validateCanopicTwoByTwoSet(cells).isPure;
  }

  countPureCanopicSets(canopicSets) {
    if (!canopicSets || canopicSets.length === 0) {
      return 0;
    }

    return canopicSets.reduce((count, cells) => (
      count + (this.isPureCanopicSet(cells) ? 1 : 0)
    ), 0);
  }

  collectTwoByTwoCandidates() {
    const candidates = [];

    for (let row = 0; row < this.board.rows - 1; row += 1) {
      for (let col = 0; col < this.board.columns - 1; col += 1) {
        const cells = this.getTwoByTwoCells(col, row);
        const validation = this.validateCanopicTwoByTwoSet(cells);

        if (!validation.isValid) {
          continue;
        }

        candidates.push({
          cells,
          isPure: validation.isPure,
          anchor: this.resolveAnchorCell(cells),
          key: `${col},${row}`,
        });
      }
    }

    return candidates.sort((a, b) => (
      Number(b.isPure) - Number(a.isPure)
      || b.anchor.row - a.anchor.row
      || a.anchor.col - b.anchor.col
      || a.key.localeCompare(b.key)
    ));
  }

  getTwoByTwoCells(startCol, startRow) {
    const positions = [
      { col: startCol, row: startRow },
      { col: startCol + 1, row: startRow },
      { col: startCol, row: startRow + 1 },
      { col: startCol + 1, row: startRow + 1 },
    ];

    return positions.map(({ col, row }) => ({
      col,
      row,
      type: this.board.getCell(col, row),
    })).sort((a, b) => b.row - a.row || a.col - b.col);
  }

  resolveAnchorCell(cells) {
    return [...cells].sort((a, b) => b.row - a.row || a.col - b.col)[0];
  }

  validateCanopicTwoByTwoSet(cells) {
    if (cells.length !== 4) {
      return { isValid: false, isPure: false };
    }

    const types = cells.map((cell) => cell.type);
    if (types.some((type) => !this.canJoinCanopicGroup(type) || type === BRAIN_TYPE)) {
      return { isValid: false, isPure: false };
    }

    const typeCounts = new Map();
    types.forEach((type) => {
      typeCounts.set(type, (typeCounts.get(type) ?? 0) + 1);
    });

    const heartCount = typeCounts.get(HEART_TYPE) ?? 0;
    if (heartCount > 1) {
      return { isValid: false, isPure: false };
    }

    const presentOrganTypes = CANOPIC_ORGAN_TYPES.filter((type) => (typeCounts.get(type) ?? 0) > 0);
    const missingOrganTypes = CANOPIC_ORGAN_TYPES.filter((type) => (typeCounts.get(type) ?? 0) === 0);

    if (heartCount === 0) {
      const isPure = presentOrganTypes.length === REQUIRED_ORGAN_SET.size;
      return { isValid: isPure, isPure };
    }

    const isHeartSubstitutionValid = presentOrganTypes.length === 3 && missingOrganTypes.length === 1;
    return { isValid: isHeartSubstitutionValid, isPure: false };
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

  canJoinCanopicGroup(type) {
    return CANOPIC_ORGAN_TYPES.includes(type) || type === HEART_TYPE;
  }
}

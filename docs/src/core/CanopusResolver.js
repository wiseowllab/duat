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
    // Canopic clears are selected as connected 4-cell groups only.
    // Larger connected regions may contain many candidates, but each resolved
    // set is exactly four orthogonally connected cells.
    const candidates = this.collectConnectedFourCellCandidates();
    const selectedSets = [];
    const usedKeys = new Set();

    candidates.forEach((candidate) => {
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
    return this.validateCanopicFourCellSet(cells).isPure;
  }

  countPureCanopicSets(canopicSets) {
    if (!canopicSets || canopicSets.length === 0) {
      return 0;
    }

    return canopicSets.reduce((count, cells) => (
      count + (this.isPureCanopicSet(cells) ? 1 : 0)
    ), 0);
  }

  collectConnectedFourCellCandidates() {
    const unique = new Map();

    for (let row = 0; row < this.board.rows; row += 1) {
      for (let col = 0; col < this.board.columns; col += 1) {
        const type = this.board.getCell(col, row);
        if (!this.canJoinCanopicGroup(type)) {
          continue;
        }

        this.enumerateConnectedSubsets([{ col, row, type }], unique);
      }
    }

    return [...unique.values()].sort((a, b) => (
      Number(b.isPure) - Number(a.isPure)
      || b.anchor.row - a.anchor.row
      || a.anchor.col - b.anchor.col
      || a.key.localeCompare(b.key)
    ));
  }

  enumerateConnectedSubsets(subset, unique) {
    if (subset.length === 4) {
      const candidate = this.buildCandidate(subset);
      if (candidate) {
        unique.set(candidate.key, candidate);
      }
      return;
    }

    const subsetKeys = new Set(subset.map((cell) => this.createCellKey(cell.col, cell.row)));
    const neighbors = this.collectNeighborCells(subset, subsetKeys);

    neighbors.forEach((neighbor) => {
      this.enumerateConnectedSubsets([...subset, neighbor], unique);
    });
  }

  collectNeighborCells(subset, subsetKeys) {
    const neighbors = new Map();

    subset.forEach((cell) => {
      ORTHOGONAL_DIRECTIONS.forEach((direction) => {
        const nextCol = cell.col + direction.col;
        const nextRow = cell.row + direction.row;

        if (!this.board.isInsideColumn(nextCol) || !this.board.isVisibleRow(nextRow)) {
          return;
        }

        const key = this.createCellKey(nextCol, nextRow);
        if (subsetKeys.has(key)) {
          return;
        }

        const type = this.board.getCell(nextCol, nextRow);
        if (!this.canJoinCanopicGroup(type)) {
          return;
        }

        neighbors.set(key, { col: nextCol, row: nextRow, type });
      });
    });

    return [...neighbors.values()];
  }

  buildCandidate(subset) {
    const sortedCells = [...subset].sort((a, b) => b.row - a.row || a.col - b.col);
    const validation = this.validateCanopicFourCellSet(sortedCells);

    if (!validation.isValid) {
      return null;
    }

    const key = sortedCells.map((cell) => this.createCellKey(cell.col, cell.row)).join('|');

    return {
      key,
      cells: sortedCells,
      isPure: validation.isPure,
      anchor: sortedCells[0],
    };
  }

  validateCanopicFourCellSet(cells) {
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
    const presentOrganTypes = CANOPIC_ORGAN_TYPES.filter((type) => (typeCounts.get(type) ?? 0) > 0);
    const missingOrganTypes = CANOPIC_ORGAN_TYPES.filter((type) => (typeCounts.get(type) ?? 0) === 0);

    if (heartCount === 0) {
      const isPure = presentOrganTypes.length === REQUIRED_ORGAN_SET.size;
      return { isValid: isPure, isPure };
    }

    const isHeartSubstitutionValid = heartCount === 1
      && presentOrganTypes.length === 3
      && missingOrganTypes.length === 1;

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

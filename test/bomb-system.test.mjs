import assert from 'node:assert/strict';
import test from 'node:test';

import { Board } from '../docs/src/core/Board.js';
import { BombSystem } from '../docs/src/core/BombSystem.js';
import { CoffinMeter } from '../docs/src/core/CoffinMeter.js';

const IMSETY = {
  id: 'imsety',
  name: 'Imsety',
  futureBombType: 'vertical_clear',
};
const HAPY = {
  id: 'hapy',
  name: 'Hapy',
  futureBombType: 'horizontal_clear',
};
const ANUBIS = {
  id: 'anubis',
  name: 'Anubis',
  futureBombType: 'brain_clear',
};
const THOTH = {
  id: 'thoth',
  name: 'Thoth',
  futureBombType: 'knowledge_convert',
};
const BASTET = {
  id: 'bastet',
  name: 'Bastet',
  futureBombType: 'protective_clear',
};
const SEKHMET = {
  id: 'sekhmet',
  name: 'Sekhmet',
  futureBombType: 'war_burst',
};
const HORUS = {
  id: 'horus',
  name: 'Horus',
  futureBombType: 'triple_column_clear',
};
const ISIS = {
  id: 'isis',
  name: 'Isis',
  futureBombType: 'piece_transform',
};
const OSIRIS = {
  id: 'osiris',
  name: 'Osiris',
  futureBombType: 'half_board_reset',
};
const SET = {
  id: 'set',
  name: 'Set',
  futureBombType: 'chaos_clear',
};

function sortCells(cells) {
  return cells
    .map(({ col, row, type }) => ({ col, row, type }))
    .sort((a, b) => a.row - b.row || a.col - b.col || a.type.localeCompare(b.type));
}

function cellsInOrder(cells) {
  return cells.map(({ col, row, type }) => ({ col, row, type }));
}

test('tier 1 vertical bomb clears a column but leaves brain pieces alone', () => {
  const board = new Board(6, 12);
  const bombs = new BombSystem();

  board.setCell(2, 1, 'liver');
  board.setCell(2, 5, 'brain');
  board.setCell(2, 9, 'heart');
  board.setCell(3, 9, 'lung');

  bombs.addBombForGod(IMSETY);
  const result = bombs.useBomb(0, { col: 2, row: 5 }, board);

  assert.deepEqual(sortCells(result.affectedCells), [
    { col: 2, row: 1, type: 'liver' },
    { col: 2, row: 9, type: 'heart' },
  ]);
});

test('tier 1 horizontal bomb clears a row but leaves brain pieces alone', () => {
  const board = new Board(6, 12);
  const bombs = new BombSystem();

  board.setCell(0, 6, 'liver');
  board.setCell(1, 6, 'brain');
  board.setCell(4, 6, 'stomach');
  board.setCell(4, 7, 'lung');

  bombs.addBombForGod(HAPY);
  const result = bombs.useBomb(0, { col: 3, row: 6 }, board);

  assert.deepEqual(sortCells(result.affectedCells), [
    { col: 0, row: 6, type: 'liver' },
    { col: 4, row: 6, type: 'stomach' },
  ]);
});

test('bomb stock receives supported bombs from god unlock events including tier 3', () => {
  const meter = new CoffinMeter([
    { ...IMSETY, tier: 1, tierName: 'Small Coffin', coffinSize: 'small', requiredMeter: 100 },
    { ...ANUBIS, tier: 2, tierName: 'Medium Coffin', coffinSize: 'medium', requiredMeter: 100 },
    { ...HORUS, tier: 3, tierName: 'Large Coffin', coffinSize: 'large', requiredMeter: 100 },
  ]);
  const bombs = new BombSystem();

  meter.addPoints(100).forEach((unlockEvent) => bombs.addBombForGod(unlockEvent.god));
  assert.deepEqual(bombs.getStock(), [{
    type: 'vertical_clear',
    name: 'Vertical',
    godId: 'imsety',
    godName: 'Imsety',
  }]);

  meter.addPoints(100).forEach((unlockEvent) => bombs.addBombForGod(unlockEvent.god));
  assert.deepEqual(bombs.getStock().map((bomb) => bomb.type), ['vertical_clear', 'brain_clear']);

  meter.addPoints(100).forEach((unlockEvent) => bombs.addBombForGod(unlockEvent.god));
  assert.deepEqual(bombs.getStock().map((bomb) => bomb.type), ['vertical_clear', 'brain_clear', 'triple_column_clear']);
});

test('using a bomb removes it from stock', () => {
  const board = new Board(6, 12);
  const bombs = new BombSystem();

  board.setCell(1, 11, 'liver');
  bombs.addBombForGod(IMSETY);
  bombs.addBombForGod(HAPY);

  const result = bombs.useBomb(0, { col: 1, row: 11 }, board);

  assert.equal(result.bomb.type, 'vertical_clear');
  assert.deepEqual(bombs.getStock().map((bomb) => bomb.type), ['horizontal_clear']);
});

test('bomb stock holds at most four supported tier 1 bombs', () => {
  const bombs = new BombSystem();

  [IMSETY, HAPY, IMSETY, HAPY, IMSETY].forEach((god) => bombs.addBombForGod(god));

  assert.equal(bombs.getStock().length, 4);
});

test('anubis brain_clear clears only brain pieces in the target row and column', () => {
  const board = new Board(6, 12);
  const bombs = new BombSystem();

  board.setCell(2, 1, 'brain');
  board.setCell(2, 5, 'liver');
  board.setCell(0, 5, 'brain');
  board.setCell(4, 5, 'heart');
  board.setCell(4, 4, 'brain');

  bombs.addBombForGod(ANUBIS);
  const result = bombs.useBomb(0, { col: 2, row: 5 }, board);

  assert.deepEqual(sortCells(result.affectedCells), [
    { col: 2, row: 1, type: 'brain' },
    { col: 0, row: 5, type: 'brain' },
  ]);
  assert.deepEqual(result.convertedCells, []);
});

test('thoth knowledge_convert converts brain pieces in a 3x3 area into hearts', () => {
  const board = new Board(6, 12);
  const bombs = new BombSystem();

  board.setCell(1, 4, 'brain');
  board.setCell(2, 4, 'brain');
  board.setCell(3, 4, 'brain');
  board.setCell(1, 5, 'brain');
  board.setCell(2, 5, 'brain');
  board.setCell(4, 5, 'brain');
  board.setCell(3, 6, 'liver');

  bombs.addBombForGod(THOTH);
  const result = bombs.useBomb(0, { col: 2, row: 5 }, board);

  assert.deepEqual(sortCells(result.convertedCells), [
    { col: 1, row: 4, type: 'brain' },
    { col: 2, row: 4, type: 'brain' },
    { col: 3, row: 4, type: 'brain' },
    { col: 1, row: 5, type: 'brain' },
  ]);
  assert.equal(result.convertedCells.every((cell) => cell.toType === 'heart'), true);
  assert.deepEqual(result.affectedCells, []);
});

test('bastet protective_clear clears brain and non-brain pieces in a 3x3 area', () => {
  const board = new Board(6, 12);
  const bombs = new BombSystem();

  board.setCell(1, 4, 'brain');
  board.setCell(2, 5, 'liver');
  board.setCell(3, 6, 'heart');
  board.setCell(4, 6, 'brain');

  bombs.addBombForGod(BASTET);
  const result = bombs.useBomb(0, { col: 2, row: 5 }, board);

  assert.deepEqual(sortCells(result.affectedCells), [
    { col: 1, row: 4, type: 'brain' },
    { col: 2, row: 5, type: 'liver' },
    { col: 3, row: 6, type: 'heart' },
  ]);
});

test('sekhmet war_burst clears a 5-cell diamond including brain pieces', () => {
  const board = new Board(6, 12);
  const bombs = new BombSystem();

  board.setCell(2, 5, 'brain');
  board.setCell(2, 4, 'liver');
  board.setCell(2, 6, 'brain');
  board.setCell(1, 5, 'heart');
  board.setCell(3, 5, 'lung');
  board.setCell(1, 4, 'stomach');

  bombs.addBombForGod(SEKHMET);
  const result = bombs.useBomb(0, { col: 2, row: 5 }, board);

  assert.deepEqual(sortCells(result.affectedCells), [
    { col: 2, row: 4, type: 'liver' },
    { col: 1, row: 5, type: 'heart' },
    { col: 2, row: 5, type: 'brain' },
    { col: 3, row: 5, type: 'lung' },
    { col: 2, row: 6, type: 'brain' },
  ]);
});

test('tier 2 bombs are added to stock when tier 2 gods unlock', () => {
  const meter = new CoffinMeter([
    { ...ANUBIS, tier: 2, tierName: 'Medium Coffin', coffinSize: 'medium', requiredMeter: 100 },
    { ...THOTH, tier: 2, tierName: 'Medium Coffin', coffinSize: 'medium', requiredMeter: 100 },
    { ...BASTET, tier: 2, tierName: 'Medium Coffin', coffinSize: 'medium', requiredMeter: 100 },
    { ...SEKHMET, tier: 2, tierName: 'Medium Coffin', coffinSize: 'medium', requiredMeter: 100 },
  ]);
  const bombs = new BombSystem();

  meter.addPoints(400).forEach((unlockEvent) => bombs.addBombForGod(unlockEvent.god));

  assert.deepEqual(bombs.getStock().map((bomb) => bomb.type), [
    'brain_clear',
    'knowledge_convert',
    'protective_clear',
    'war_burst',
  ]);
});

test('horus triple_column_clear clears target and adjacent columns including brain pieces', () => {
  const board = new Board(6, 12);
  const bombs = new BombSystem();

  board.setCell(1, 2, 'liver');
  board.setCell(2, 3, 'brain');
  board.setCell(3, 4, 'heart');
  board.setCell(4, 5, 'lung');

  bombs.addBombForGod(HORUS);
  const result = bombs.useBomb(0, { col: 2, row: 6 }, board);

  assert.deepEqual(sortCells(result.affectedCells), [
    { col: 1, row: 2, type: 'liver' },
    { col: 2, row: 3, type: 'brain' },
    { col: 3, row: 4, type: 'heart' },
  ]);
});

test('horus triple_column_clear clamps neighboring columns at the board edge', () => {
  const board = new Board(6, 12);
  const bombs = new BombSystem();

  board.setCell(0, 2, 'brain');
  board.setCell(1, 3, 'liver');
  board.setCell(2, 4, 'heart');

  bombs.addBombForGod(HORUS);
  const result = bombs.useBomb(0, { col: 0, row: 6 }, board);

  assert.deepEqual(sortCells(result.affectedCells), [
    { col: 0, row: 2, type: 'brain' },
    { col: 1, row: 3, type: 'liver' },
  ]);
});

test('isis piece_transform converts brain pieces in a 5x5 area into hearts', () => {
  const board = new Board(6, 12);
  const bombs = new BombSystem();

  board.setCell(0, 3, 'brain');
  board.setCell(1, 4, 'brain');
  board.setCell(4, 7, 'brain');
  board.setCell(5, 7, 'brain');
  board.setCell(2, 5, 'liver');
  board.setCell(3, 5, 'heart');

  bombs.addBombForGod(ISIS);
  const result = bombs.useBomb(0, { col: 2, row: 5 }, board);

  assert.deepEqual(sortCells(result.convertedCells), [
    { col: 0, row: 3, type: 'brain' },
    { col: 1, row: 4, type: 'brain' },
    { col: 4, row: 7, type: 'brain' },
  ]);
  assert.equal(result.convertedCells.every((cell) => cell.toType === 'heart'), true);
  assert.deepEqual(result.affectedCells, []);
});

test('isis piece_transform converts up to three normal organs to hearts if no brain exists', () => {
  const board = new Board(6, 12);
  const bombs = new BombSystem();

  board.setCell(0, 3, 'liver');
  board.setCell(1, 4, 'lung');
  board.setCell(2, 5, 'heart');
  board.setCell(3, 5, 'stomach');
  board.setCell(4, 7, 'intestine');
  board.setCell(5, 7, 'brain');

  bombs.addBombForGod(ISIS);
  const result = bombs.useBomb(0, { col: 2, row: 5 }, board);

  assert.equal(result.convertedCells.length, 3);
  assert.equal(result.convertedCells.every((cell) => cell.toType === 'heart'), true);
  assert.equal(result.convertedCells.every((cell) => ['liver', 'lung', 'stomach', 'intestine'].includes(cell.type)), true);
  assert.equal(result.convertedCells.some((cell) => cell.type === 'heart'), false);
  assert.equal(result.convertedCells.some((cell) => cell.type === 'brain'), false);
});

test('osiris half_board_reset clears the left half based on target column including brain pieces', () => {
  const board = new Board(6, 12);
  const bombs = new BombSystem();

  board.setCell(0, 1, 'brain');
  board.setCell(1, 2, 'liver');
  board.setCell(2, 3, 'heart');
  board.setCell(3, 4, 'stomach');

  bombs.addBombForGod(OSIRIS);
  const result = bombs.useBomb(0, { col: 2, row: 5 }, board);

  assert.deepEqual(sortCells(result.affectedCells), [
    { col: 0, row: 1, type: 'brain' },
    { col: 1, row: 2, type: 'liver' },
    { col: 2, row: 3, type: 'heart' },
  ]);
});

test('osiris half_board_reset clears the right half based on target column including brain pieces', () => {
  const board = new Board(6, 12);
  const bombs = new BombSystem();

  board.setCell(2, 3, 'heart');
  board.setCell(3, 4, 'brain');
  board.setCell(4, 5, 'stomach');
  board.setCell(5, 6, 'lung');

  bombs.addBombForGod(OSIRIS);
  const result = bombs.useBomb(0, { col: 3, row: 5 }, board);

  assert.deepEqual(sortCells(result.affectedCells), [
    { col: 3, row: 4, type: 'brain' },
    { col: 4, row: 5, type: 'stomach' },
    { col: 5, row: 6, type: 'lung' },
  ]);
});

test('set chaos_clear clears up to eight occupied cells using deterministic priority', () => {
  const board = new Board(6, 12);
  const bombs = new BombSystem();

  [
    [2, 5, 'brain'],
    [2, 4, 'liver'],
    [1, 5, 'heart'],
    [3, 5, 'lung'],
    [2, 6, 'stomach'],
    [1, 4, 'intestine'],
    [3, 4, 'brain'],
    [0, 5, 'liver'],
    [4, 5, 'lung'],
    [5, 5, 'stomach'],
  ].forEach(([col, row, type]) => board.setCell(col, row, type));

  bombs.addBombForGod(SET);
  const result = bombs.useBomb(0, { col: 2, row: 5 }, board);

  assert.deepEqual(cellsInOrder(result.affectedCells), [
    { col: 2, row: 5, type: 'brain' },
    { col: 2, row: 4, type: 'liver' },
    { col: 1, row: 5, type: 'heart' },
    { col: 3, row: 5, type: 'lung' },
    { col: 2, row: 6, type: 'stomach' },
    { col: 1, row: 4, type: 'intestine' },
    { col: 3, row: 4, type: 'brain' },
    { col: 0, row: 5, type: 'liver' },
  ]);
});

test('tier 3 bombs are added to stock when tier 3 gods unlock', () => {
  const meter = new CoffinMeter([
    { ...HORUS, tier: 3, tierName: 'Large Coffin', coffinSize: 'large', requiredMeter: 100 },
    { ...ISIS, tier: 3, tierName: 'Large Coffin', coffinSize: 'large', requiredMeter: 100 },
    { ...OSIRIS, tier: 3, tierName: 'Large Coffin', coffinSize: 'large', requiredMeter: 100 },
    { ...SET, tier: 3, tierName: 'Large Coffin', coffinSize: 'large', requiredMeter: 100 },
  ]);
  const bombs = new BombSystem();

  meter.addPoints(400).forEach((unlockEvent) => bombs.addBombForGod(unlockEvent.god));

  assert.deepEqual(bombs.getStock(), [
    { type: 'triple_column_clear', name: 'Triple Column', godId: 'horus', godName: 'Horus' },
    { type: 'piece_transform', name: 'Transform', godId: 'isis', godName: 'Isis' },
    { type: 'half_board_reset', name: 'Half Reset', godId: 'osiris', godName: 'Osiris' },
    { type: 'chaos_clear', name: 'Chaos', godId: 'set', godName: 'Set' },
  ]);
});

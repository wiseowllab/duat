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

function sortCells(cells) {
  return cells
    .map(({ col, row, type }) => ({ col, row, type }))
    .sort((a, b) => a.row - b.row || a.col - b.col || a.type.localeCompare(b.type));
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

test('bomb stock receives supported bombs from god unlock events and ignores unsupported types', () => {
  const meter = new CoffinMeter([
    { ...IMSETY, tier: 1, tierName: 'Small Coffin', coffinSize: 'small', requiredMeter: 100 },
    { ...ANUBIS, tier: 2, tierName: 'Medium Coffin', coffinSize: 'medium', requiredMeter: 100 },
    { id: 'horus', name: 'Horus', futureBombType: 'triple_column_clear', tier: 3, tierName: 'Large Coffin', coffinSize: 'large', requiredMeter: 100 },
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
  assert.deepEqual(bombs.getStock().map((bomb) => bomb.type), ['vertical_clear', 'brain_clear']);
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

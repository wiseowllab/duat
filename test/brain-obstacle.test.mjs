import assert from 'node:assert/strict';
import test from 'node:test';

import { Board } from '../docs/src/core/Board.js';
import { CanopusResolver } from '../docs/src/core/CanopusResolver.js';
import { GravitySystem } from '../docs/src/core/GravitySystem.js';
import { MatchResolver } from '../docs/src/core/MatchResolver.js';

function setCells(board, cells) {
  cells.forEach(({ col, row, type }) => {
    board.setCell(col, row, type);
  });
}

test('four connected brain pieces do not clear as a same-type match', () => {
  const board = new Board(6, 12);
  const matchResolver = new MatchResolver(board);

  setCells(board, [
    { col: 0, row: 10, type: 'brain' },
    { col: 1, row: 10, type: 'brain' },
    { col: 0, row: 11, type: 'brain' },
    { col: 1, row: 11, type: 'brain' },
  ]);

  const matches = matchResolver.findMatches();
  assert.deepEqual(matches, []);

  const clearedCells = matchResolver.clearMatches(matches);
  assert.deepEqual(clearedCells, []);

  assert.equal(board.getCell(0, 10), 'brain');
  assert.equal(board.getCell(1, 10), 'brain');
  assert.equal(board.getCell(0, 11), 'brain');
  assert.equal(board.getCell(1, 11), 'brain');
});

test('four connected liver pieces still clear as a same-type match', () => {
  const board = new Board(6, 12);
  const matchResolver = new MatchResolver(board);

  setCells(board, [
    { col: 0, row: 10, type: 'liver' },
    { col: 1, row: 10, type: 'liver' },
    { col: 0, row: 11, type: 'liver' },
    { col: 1, row: 11, type: 'liver' },
  ]);

  const matches = matchResolver.findMatches();
  assert.equal(matches.length, 1);
  assert.equal(matches[0].length, 4);

  const clearedCells = matchResolver.clearMatches(matches);
  assert.equal(clearedCells.length, 4);

  assert.equal(board.getCell(0, 10), null);
  assert.equal(board.getCell(1, 10), null);
  assert.equal(board.getCell(0, 11), null);
  assert.equal(board.getCell(1, 11), null);
});

test('brain does not connect otherwise separate canopic groups', () => {
  const board = new Board(6, 12);
  const canopusResolver = new CanopusResolver(board);

  setCells(board, [
    { col: 0, row: 11, type: 'liver' },
    { col: 1, row: 11, type: 'lung' },
    { col: 2, row: 11, type: 'brain' },
    { col: 3, row: 11, type: 'stomach' },
    { col: 4, row: 11, type: 'intestine' },
  ]);

  assert.deepEqual(canopusResolver.findCanopicSets(), []);
});

test('brain pieces still fall normally during board gravity', () => {
  const board = new Board(6, 12);
  const gravity = new GravitySystem(board);

  board.setCell(2, 4, 'brain');

  const movedPieces = gravity.applyBoardGravity();

  assert.equal(movedPieces, 1);
  assert.equal(board.getCell(2, 4), null);
  assert.equal(board.getCell(2, 11), 'brain');
});

test('canopic set with one adjacent brain clears that brain as a bonus', () => {
  const board = new Board(6, 12);
  const canopusResolver = new CanopusResolver(board);
  const matchResolver = new MatchResolver(board);

  setCells(board, [
    { col: 1, row: 10, type: 'liver' },
    { col: 2, row: 10, type: 'lung' },
    { col: 3, row: 10, type: 'stomach' },
    { col: 4, row: 10, type: 'intestine' },
    { col: 2, row: 9, type: 'brain' },
  ]);

  const canopicSets = canopusResolver.findCanopicSets();
  const brainBonusCell = canopusResolver.findAdjacentBrainBonusCell(canopicSets);

  assert.deepEqual(brainBonusCell, {
    col: 2,
    row: 9,
    type: 'brain',
    adjacentCanopicCount: 1,
  });

  assert.equal(canopicSets.length, 1);
  assert.equal(canopicSets[0].length, 4);

  matchResolver.clearCells([...canopicSets.flat(), brainBonusCell]);
  assert.equal(board.getCell(2, 9), null);
});

test('pure canopic set clears exactly four selected organ cells', () => {
  const board = new Board(6, 12);
  const canopusResolver = new CanopusResolver(board);

  setCells(board, [
    { col: 0, row: 11, type: 'liver' },
    { col: 1, row: 11, type: 'lung' },
    { col: 2, row: 11, type: 'stomach' },
    { col: 3, row: 11, type: 'intestine' },
    { col: 4, row: 11, type: 'heart' },
  ]);

  const canopicSets = canopusResolver.findCanopicSets();
  assert.equal(canopicSets.length, 1);
  assert.equal(canopicSets[0].length, 4);
  assert.deepEqual(canopicSets[0].map((cell) => cell.type).sort(), ['intestine', 'liver', 'lung', 'stomach']);
});

test('heart substitution canopic set clears exactly four cells', () => {
  const board = new Board(6, 12);
  const canopusResolver = new CanopusResolver(board);

  setCells(board, [
    { col: 1, row: 11, type: 'liver' },
    { col: 2, row: 11, type: 'lung' },
    { col: 3, row: 11, type: 'stomach' },
    { col: 4, row: 11, type: 'heart' },
  ]);

  const canopicSets = canopusResolver.findCanopicSets();
  assert.equal(canopicSets.length, 1);
  assert.equal(canopicSets[0].length, 4);
  assert.deepEqual(canopicSets[0].map((cell) => cell.type).sort(), ['heart', 'liver', 'lung', 'stomach']);
});

test('extra connected canopic-eligible cells are not included in selected canopic clear cells', () => {
  const board = new Board(6, 12);
  const canopusResolver = new CanopusResolver(board);

  setCells(board, [
    { col: 0, row: 11, type: 'liver' },
    { col: 1, row: 11, type: 'lung' },
    { col: 2, row: 11, type: 'stomach' },
    { col: 3, row: 11, type: 'intestine' },
    { col: 4, row: 11, type: 'liver' },
    { col: 5, row: 11, type: 'heart' },
  ]);

  const canopicSets = canopusResolver.findCanopicSets();
  assert.equal(canopicSets.length, 1);
  assert.equal(canopicSets[0].length, 4);
  assert.deepEqual(canopicSets[0].map((cell) => cell.type).sort(), ['intestine', 'liver', 'lung', 'stomach']);
});

test('canopic cell selection is deterministic: lower row first, then left-to-right', () => {
  const board = new Board(6, 12);
  const canopusResolver = new CanopusResolver(board);

  setCells(board, [
    { col: 0, row: 10, type: 'liver' },
    { col: 1, row: 10, type: 'lung' },
    { col: 2, row: 10, type: 'stomach' },
    { col: 3, row: 10, type: 'intestine' },
    { col: 4, row: 10, type: 'liver' },
    { col: 0, row: 11, type: 'liver' },
  ]);

  const [selectedSet] = canopusResolver.findCanopicSets();
  const selectedLiver = selectedSet.find((cell) => cell.type === 'liver');

  assert.deepEqual(selectedLiver, { col: 0, row: 11, type: 'liver' });
});

test('canopic set with multiple adjacent brain candidates selects only the highest-priority brain', () => {
  const board = new Board(6, 12);
  const canopusResolver = new CanopusResolver(board);

  setCells(board, [
    { col: 1, row: 5, type: 'liver' },
    { col: 2, row: 5, type: 'lung' },
    { col: 3, row: 5, type: 'stomach' },
    { col: 1, row: 6, type: 'intestine' },
    { col: 2, row: 6, type: 'brain' },
    { col: 0, row: 5, type: 'brain' },
    { col: 4, row: 5, type: 'brain' },
  ]);

  const canopicSets = canopusResolver.findCanopicSets();
  const brainBonusCell = canopusResolver.findAdjacentBrainBonusCell(canopicSets);

  assert.deepEqual(brainBonusCell, {
    col: 2,
    row: 6,
    type: 'brain',
    adjacentCanopicCount: 2,
  });
});

test('adjacent brain priority chooses the lower row when adjacency counts tie', () => {
  const board = new Board(6, 12);
  const canopusResolver = new CanopusResolver(board);

  setCells(board, [
    { col: 1, row: 5, type: 'liver' },
    { col: 2, row: 5, type: 'lung' },
    { col: 3, row: 5, type: 'stomach' },
    { col: 4, row: 5, type: 'intestine' },
    { col: 0, row: 5, type: 'brain' },
    { col: 3, row: 6, type: 'brain' },
  ]);

  const canopicSets = canopusResolver.findCanopicSets();
  const brainBonusCell = canopusResolver.findAdjacentBrainBonusCell(canopicSets);

  assert.deepEqual(brainBonusCell, {
    col: 3,
    row: 6,
    type: 'brain',
    adjacentCanopicCount: 1,
  });
});

test('adjacent brain priority chooses the leftmost column when count and row tie', () => {
  const board = new Board(6, 12);
  const canopusResolver = new CanopusResolver(board);

  setCells(board, [
    { col: 1, row: 5, type: 'liver' },
    { col: 2, row: 5, type: 'lung' },
    { col: 3, row: 5, type: 'stomach' },
    { col: 4, row: 5, type: 'intestine' },
    { col: 0, row: 5, type: 'brain' },
    { col: 5, row: 5, type: 'brain' },
  ]);

  const canopicSets = canopusResolver.findCanopicSets();
  const brainBonusCell = canopusResolver.findAdjacentBrainBonusCell(canopicSets);

  assert.deepEqual(brainBonusCell, {
    col: 0,
    row: 5,
    type: 'brain',
    adjacentCanopicCount: 1,
  });
});

test('diagonal brain adjacency does not qualify for a canopic bonus clear', () => {
  const board = new Board(6, 12);
  const canopusResolver = new CanopusResolver(board);

  setCells(board, [
    { col: 1, row: 5, type: 'liver' },
    { col: 2, row: 5, type: 'lung' },
    { col: 3, row: 5, type: 'stomach' },
    { col: 4, row: 5, type: 'intestine' },
    { col: 0, row: 4, type: 'brain' },
  ]);

  const canopicSets = canopusResolver.findCanopicSets();

  assert.equal(canopusResolver.findAdjacentBrainBonusCell(canopicSets), null);
});

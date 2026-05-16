import assert from 'node:assert/strict';
import test from 'node:test';

import { Board } from '../docs/src/core/Board.js';
import { GravitySystem } from '../docs/src/core/GravitySystem.js';
import { Piece } from '../docs/src/core/Piece.js';

test('post-lock gravity drops an unsupported horizontal pair cell independently', () => {
  const board = new Board(6, 12);
  const gravity = new GravitySystem(board);
  const pair = new Piece(['liver', 'lung'], 2, 10, 1);

  board.setCell(2, 11, 'brain');

  assert.equal(board.lockPiece(pair), true);
  assert.equal(board.getCell(2, 10), 'liver');
  assert.equal(board.getCell(3, 10), 'lung');

  gravity.applyBoardGravity();

  assert.equal(board.getCell(2, 10), 'liver');
  assert.equal(board.getCell(2, 11), 'brain');
  assert.equal(board.getCell(3, 10), null);
  assert.equal(board.getCell(3, 11), 'lung');
});

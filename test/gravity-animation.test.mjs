import assert from 'node:assert/strict';
import test from 'node:test';

globalThis.Phaser = { Scene: class {} };

const { Board } = await import('../docs/src/core/Board.js');
const { GravitySystem } = await import('../docs/src/core/GravitySystem.js');
const { GameScene } = await import('../docs/src/scenes/GameScene.js');

function createGravityTestScene() {
  const scene = Object.create(GameScene.prototype);
  scene.board = new Board(6, 12);
  scene.gravity = new GravitySystem(scene.board);
  scene.renderCount = 0;
  scene.waits = [];
  scene.renderBoard = () => {
    scene.renderCount += 1;
  };
  scene.wait = (ms) => {
    scene.waits.push(ms);
    return Promise.resolve();
  };
  return scene;
}

test('board gravity step moves eligible cells down by one visible row', () => {
  const board = new Board(6, 12);
  const gravity = new GravitySystem(board);

  board.setCell(1, 9, 'liver');
  board.setCell(1, 11, 'brain');
  board.setCell(2, 8, 'lung');

  const movedPieces = gravity.applyBoardGravityStep();

  assert.equal(movedPieces, 2);
  assert.equal(board.getCell(1, 9), null);
  assert.equal(board.getCell(1, 10), 'liver');
  assert.equal(board.getCell(1, 11), 'brain');
  assert.equal(board.getCell(2, 8), null);
  assert.equal(board.getCell(2, 9), 'lung');
});

test('stepwise board gravity renders once when no cells move', async () => {
  const scene = createGravityTestScene();
  scene.board.setCell(2, 11, 'liver');

  await scene.applyBoardGravityStepwise();

  assert.equal(scene.renderCount, 1);
  assert.deepEqual(scene.waits, []);
});

test('stepwise board gravity repeatedly settles floating cells without tweens', async () => {
  const scene = createGravityTestScene();
  scene.board.setCell(3, 9, 'lung');

  await scene.applyBoardGravityStepwise();

  assert.equal(scene.board.getCell(3, 9), null);
  assert.equal(scene.board.getCell(3, 10), null);
  assert.equal(scene.board.getCell(3, 11), 'lung');
  assert.equal(scene.renderCount, 3);
  assert.deepEqual(scene.waits, [55, 55]);
});

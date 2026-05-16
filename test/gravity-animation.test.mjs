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
  scene.blockSprites = [];
  scene.boardGravitySprites = [];
  scene.boardGravityTween = null;
  scene.renderCount = 0;
  scene.clearBlockSprites = () => {
    scene.blockSprites = [];
  };
  scene.renderBoard = () => {
    scene.renderCount += 1;
  };
  scene.renderBoardForGravityAnimation = () => {};
  scene.getCellCenter = (col, row) => ({ x: col * 40 + 20, y: row * 40 + 20 });
  scene.createBlockSprite = (x, y, type, alpha) => ({
    x,
    y,
    type,
    alpha,
    destroyed: false,
    setDepth() {
      return this;
    },
    destroy() {
      this.destroyed = true;
    },
  });
  scene.time = {
    delayedCall(_delay, callback) {
      const id = setTimeout(callback, 0);
      return {
        remove() {
          clearTimeout(id);
        },
      };
    },
  };
  scene.tweens = {
    add(config) {
      scene.lastTweenConfig = config;
      return { remove() {} };
    },
  };
  return scene;
}

test('board gravity animation returns immediately when no cells move', async () => {
  const scene = createGravityTestScene();
  scene.board.setCell(2, 11, 'liver');

  await scene.applyBoardGravityWithAnimation();

  assert.equal(scene.renderCount, 1);
  assert.equal(scene.boardGravitySprites.length, 0);
  assert.equal(scene.lastTweenConfig, undefined);
});

test('board gravity animation resolves via failsafe when tween completion does not fire', async () => {
  const scene = createGravityTestScene();
  scene.board.setCell(3, 10, 'lung');

  await scene.applyBoardGravityWithAnimation();

  assert.equal(scene.board.getCell(3, 10), null);
  assert.equal(scene.board.getCell(3, 11), 'lung');
  assert.equal(scene.renderCount, 1);
  assert.equal(scene.boardGravitySprites.length, 0);
  assert.equal(scene.boardGravityTween, null);
  assert.ok(scene.lastTweenConfig);
});

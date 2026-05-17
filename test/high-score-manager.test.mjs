import assert from 'node:assert/strict';
import test from 'node:test';
import { HighScoreManager } from '../docs/src/core/HighScoreManager.js';

function createStorage() {
  const values = new Map();
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    },
  };
}

test('recordRun persists only improved high score and run records', () => {
  const originalWindow = globalThis.window;
  globalThis.window = { localStorage: createStorage() };

  try {
    const manager = new HighScoreManager('duat.highScore.test');
    const firstResult = manager.recordRun({
      score: 1200,
      maxChain: 3,
      maxTier: 2,
      maxGodsUnlocked: 5,
    });

    assert.equal(firstResult.isNewHighScore, true);
    assert.equal(firstResult.records.highScore, 1200);
    assert.equal(firstResult.records.maxChain, 3);
    assert.equal(firstResult.records.maxTier, 2);
    assert.equal(firstResult.records.maxGodsUnlocked, 5);
    assert.equal(typeof firstResult.records.bestRunDate, 'string');

    const secondResult = manager.recordRun({
      score: 800,
      maxChain: 4,
      maxTier: 1,
      maxGodsUnlocked: 2,
    });

    assert.equal(secondResult.isNewHighScore, false);
    assert.equal(secondResult.records.highScore, 1200);
    assert.equal(secondResult.records.maxChain, 4);
    assert.equal(secondResult.records.maxTier, 2);
    assert.equal(secondResult.records.maxGodsUnlocked, 5);
  } finally {
    if (originalWindow === undefined) {
      delete globalThis.window;
    } else {
      globalThis.window = originalWindow;
    }
  }
});

test('manager safely falls back when localStorage is unavailable', () => {
  const originalWindow = globalThis.window;
  const originalWarn = console.warn;
  globalThis.window = {
    get localStorage() {
      throw new Error('blocked');
    },
  };
  console.warn = () => {};

  try {
    const manager = new HighScoreManager('duat.highScore.blocked');
    const result = manager.recordRun({
      score: 500,
      maxChain: 2,
      maxTier: 1,
      maxGodsUnlocked: 0,
    });

    assert.equal(result.records.highScore, 500);
    assert.equal(result.isNewHighScore, true);
    assert.deepEqual(manager.getRecords(), {
      highScore: 0,
      maxChain: 0,
      maxTier: 0,
      maxGodsUnlocked: 0,
      bestRunDate: null,
    });
  } finally {
    console.warn = originalWarn;
    if (originalWindow === undefined) {
      delete globalThis.window;
    } else {
      globalThis.window = originalWindow;
    }
  }
});

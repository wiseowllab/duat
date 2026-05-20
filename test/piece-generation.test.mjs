import assert from 'node:assert/strict';
import test from 'node:test';

import { BRAIN_TYPE } from '../docs/src/data/pieces.js';

function withMockedRandom(values, fn) {
  const originalRandom = Math.random;
  let index = 0;
  Math.random = () => {
    if (index >= values.length) {
      throw new Error(`Math.random exhausted at call ${index}`);
    }
    return values[index++];
  };

  try {
    return fn();
  } finally {
    Math.random = originalRandom;
  }
}

test('normal generation excludes brain when obstacle chance does not trigger', async () => {
  const piecesModule = await import('../docs/src/data/pieces.js');

  const pair = withMockedRandom([
    0.0, // first weighted piece => liver
    0.1, // second weighted piece => liver/lung region but never brain
    0.99, // obstacle chance check => no brain replacement
  ], () => piecesModule.createRandomPairTypes());

  assert.equal(pair.length, 2);
  assert.equal(pair.includes(BRAIN_TYPE), false);
});

test('forcing obstacle chance to trigger creates exactly one brain piece', async () => {
  const piecesModule = await import('../docs/src/data/pieces.js');

  const pair = withMockedRandom([
    0.0, // first weighted piece
    0.2, // second weighted piece
    0.0, // obstacle chance check => brain replacement triggers
    0.3, // replace index => first slot
  ], () => piecesModule.createRandomPairTypes());

  const brainCount = pair.filter((type) => type === BRAIN_TYPE).length;
  assert.equal(brainCount, 1);
});

test('generated pairs never contain two brains under obstacle replacement rule', async () => {
  const piecesModule = await import('../docs/src/data/pieces.js');

  const pair = withMockedRandom([
    0.0,
    0.2,
    0.0,
    0.8, // replace index => second slot
  ], () => piecesModule.createRandomPairTypes());

  const brainCount = pair.filter((type) => type === BRAIN_TYPE).length;
  assert.equal(brainCount <= 1, true);
});

test('normal organ and heart weighted generation still works', async () => {
  const piecesModule = await import('../docs/src/data/pieces.js');

  const organPair = withMockedRandom([
    0.01,
    0.45,
    0.99,
  ], () => piecesModule.createRandomPairTypes());
  assert.equal(organPair.includes(BRAIN_TYPE), false);

  const heartPair = withMockedRandom([
    0.95,
    0.97,
    0.99,
  ], () => piecesModule.createRandomPairTypes());
  assert.equal(heartPair[0], 'heart');
  assert.equal(heartPair[1], 'heart');
});

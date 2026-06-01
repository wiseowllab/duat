import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getResultTempleAsset,
  normalizeUnlockedGodCount,
  RESULT_TEMPLE_ASSETS,
} from '../docs/src/data/resultTemples.js';

const expectedTempleFiles = [
  'temple_0_ruins.png',
  'temple_1_small.png',
  'temple_2_medium.png',
  'temple_3_great.png',
  'temple_4_complete.png',
];

test('result temple assets map all required temple PNGs', () => {
  assert.deepEqual(RESULT_TEMPLE_ASSETS.map((asset) => asset.fileName), expectedTempleFiles);
});

test('result temple selection follows current-run unlocked god count ranges', () => {
  assert.equal(getResultTempleAsset(0).fileName, 'temple_0_ruins.png');
  assert.equal(getResultTempleAsset(2).fileName, 'temple_0_ruins.png');
  assert.equal(getResultTempleAsset(3).fileName, 'temple_1_small.png');
  assert.equal(getResultTempleAsset(5).fileName, 'temple_1_small.png');
  assert.equal(getResultTempleAsset(6).fileName, 'temple_2_medium.png');
  assert.equal(getResultTempleAsset(8).fileName, 'temple_2_medium.png');
  assert.equal(getResultTempleAsset(9).fileName, 'temple_3_great.png');
  assert.equal(getResultTempleAsset(12).fileName, 'temple_3_great.png');
  assert.equal(getResultTempleAsset(13).fileName, 'temple_4_complete.png');
  assert.equal(getResultTempleAsset(14).fileName, 'temple_4_complete.png');
});

test('result temple unlocked god count clamps to 0-14', () => {
  assert.equal(normalizeUnlockedGodCount(-1), 0);
  assert.equal(normalizeUnlockedGodCount(4.8), 4);
  assert.equal(normalizeUnlockedGodCount(99), 14);
  assert.equal(getResultTempleAsset(99).fileName, 'temple_4_complete.png');
});

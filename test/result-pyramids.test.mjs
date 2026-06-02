import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getResultPyramidRevealRatio,
  normalizePreservedGodCount,
  RESULT_PYRAMID_COMPLETE_ASSET,
} from '../docs/src/data/resultPyramids.js';

test('result pyramid asset maps to the single complete pyramid PNG', () => {
  assert.equal(RESULT_PYRAMID_COMPLETE_ASSET.fileName, 'pyramid_complete.png');
  assert.match(RESULT_PYRAMID_COMPLETE_ASSET.path, /images\/result\/pyramid\/pyramid_complete\.png$/);
});

test('result pyramid reveal ratio follows preserved god count steps', () => {
  assert.equal(getResultPyramidRevealRatio(0), 0);
  assert.equal(getResultPyramidRevealRatio(1), 0);
  assert.equal(getResultPyramidRevealRatio(2), 0.2);
  assert.equal(getResultPyramidRevealRatio(3), 0.2);
  assert.equal(getResultPyramidRevealRatio(4), 0.35);
  assert.equal(getResultPyramidRevealRatio(5), 0.35);
  assert.equal(getResultPyramidRevealRatio(6), 0.5);
  assert.equal(getResultPyramidRevealRatio(7), 0.5);
  assert.equal(getResultPyramidRevealRatio(8), 0.65);
  assert.equal(getResultPyramidRevealRatio(9), 0.65);
  assert.equal(getResultPyramidRevealRatio(10), 0.8);
  assert.equal(getResultPyramidRevealRatio(11), 0.8);
  assert.equal(getResultPyramidRevealRatio(12), 0.92);
  assert.equal(getResultPyramidRevealRatio(13), 0.92);
  assert.equal(getResultPyramidRevealRatio(14), 1);
});

test('result pyramid preserved god count clamps to 0-14', () => {
  assert.equal(normalizePreservedGodCount(-1), 0);
  assert.equal(normalizePreservedGodCount(4.8), 4);
  assert.equal(normalizePreservedGodCount(99), 14);
  assert.equal(getResultPyramidRevealRatio(99), 1);
});

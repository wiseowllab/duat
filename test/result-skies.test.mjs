import assert from 'node:assert/strict';
import test from 'node:test';
import { getResultSkyAsset, normalizeResultSkyTier, RESULT_SKY_ASSETS } from '../docs/src/data/resultSkies.js';

test('result sky assets map one PNG to each coffin tier', () => {
  assert.deepEqual(Object.keys(RESULT_SKY_ASSETS), ['1', '2', '3', '4']);
  assert.equal(getResultSkyAsset(1).fileName, 'sky_tier1_night.png');
  assert.equal(getResultSkyAsset(2).fileName, 'sky_tier2_starry.png');
  assert.equal(getResultSkyAsset(3).fileName, 'sky_tier3_dawn.png');
  assert.equal(getResultSkyAsset(4).fileName, 'sky_tier4_sunrise.png');
});

test('result sky tier selection clamps to available Tier 1-4 backgrounds', () => {
  assert.equal(normalizeResultSkyTier(0), 1);
  assert.equal(normalizeResultSkyTier(1.8), 1);
  assert.equal(normalizeResultSkyTier(3), 3);
  assert.equal(normalizeResultSkyTier(99), 4);
  assert.equal(getResultSkyAsset(99).fileName, 'sky_tier4_sunrise.png');
});

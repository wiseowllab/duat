import test from 'node:test';
import assert from 'node:assert/strict';

import { COFFIN_ASSETS, getCoffinAssetForStage } from '../docs/src/data/coffins.js';
import { GODS, TOTAL_GOD_COUNT } from '../docs/src/data/gods.js';

function createTextureScene(loadedKeys = []) {
  const keys = new Set(loadedKeys);
  return {
    textures: {
      exists(key) {
        return keys.has(key);
      },
    },
  };
}

test('coffin asset map reserves one unique PNG key for each god stage', () => {
  assert.equal(COFFIN_ASSETS.length, TOTAL_GOD_COUNT);
  assert.equal(COFFIN_ASSETS.length, 14);

  COFFIN_ASSETS.forEach((asset, index) => {
    const stage = index + 1;
    const stageNumber = String(stage).padStart(2, '0');
    assert.equal(asset.stage, stage);
    assert.equal(asset.godId, GODS[index].id);
    assert.equal(asset.assetKey, `coffin_${stageNumber}`);
    assert.equal(asset.fileName, `coffin_${stageNumber}.png`);
    assert.equal(asset.path, `assets/images/coffins/coffin_${stageNumber}.png`);
  });
});

test('coffin stage assets preserve current tier PNGs as fallback', () => {
  const fallbackKeys = COFFIN_ASSETS.map((asset) => asset.fallbackKey);

  assert.deepEqual(fallbackKeys.slice(0, 4), [
    'coffin-small',
    'coffin-small',
    'coffin-small',
    'coffin-small',
  ]);
  assert.deepEqual(fallbackKeys.slice(4, 8), [
    'coffin-medium',
    'coffin-medium',
    'coffin-medium',
    'coffin-medium',
  ]);
  assert.deepEqual(fallbackKeys.slice(8, 12), [
    'coffin-large',
    'coffin-large',
    'coffin-large',
    'coffin-large',
  ]);
  assert.deepEqual(fallbackKeys.slice(12, 14), [
    'coffin-maximum',
    'coffin-maximum',
  ]);
});

test('coffin stage resolution uses fallback until the unique PNG is loaded', () => {
  const fallbackAsset = getCoffinAssetForStage(1, createTextureScene());
  assert.equal(fallbackAsset.key, 'coffin-small');
  assert.equal(fallbackAsset.fallbackForAssetKey, 'coffin_01');

  const uniqueAsset = getCoffinAssetForStage(1, createTextureScene(['coffin_01']));
  assert.equal(uniqueAsset.key, 'coffin_01');
  assert.equal(uniqueAsset.fileName, 'coffin_01.png');
});

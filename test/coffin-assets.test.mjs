import test from 'node:test';
import assert from 'node:assert/strict';

import {
  COFFIN_ASSETS,
  COFFIN_ASSET_VARIANTS,
  GOD_COFFIN_FILE_NAMES,
  GOD_COFFIN_KEY_BY_GOD_ID,
  getCoffinAssetForGod,
  getCoffinAssetForStage,
} from '../docs/src/data/coffins.js';
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

test('coffin asset map reserves one god-specific PNG key for each god', () => {
  assert.equal(COFFIN_ASSETS.length, TOTAL_GOD_COUNT);
  assert.equal(COFFIN_ASSETS.length, 14);
  assert.equal(GOD_COFFIN_FILE_NAMES.length, 14);

  COFFIN_ASSETS.forEach((asset, index) => {
    const god = GODS[index];
    const expectedKey = GOD_COFFIN_KEY_BY_GOD_ID[god.id];
    assert.equal(asset.stage, index + 1);
    assert.equal(asset.godId, god.id);
    assert.equal(asset.godName, god.name);
    assert.equal(asset.assetKey, expectedKey);
    assert.equal(asset.fileName, `${expectedKey}.png`);
    assert.equal(asset.path, `assets/images/coffins/gods/${expectedKey}.png`);
    assert.equal(asset.coffinHighKey, expectedKey);
    assert.equal(asset.coffinHighPath, `assets/images/coffins/gods/${expectedKey}.png`);
    assert.equal(asset.coffinIconKey, `${expectedKey}_icon_64`);
    assert.equal(asset.coffinIconPath, `assets/images/coffins/icons/${expectedKey}_icon_64.png`);
  });
});

test('god coffin assets preserve current tier PNGs as fallback', () => {
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

test('coffin resolution uses fallback until the god-specific PNG is loaded', () => {
  const imsety = GODS[0];
  const fallbackAsset = getCoffinAssetForGod(imsety, createTextureScene());
  assert.equal(fallbackAsset.key, 'coffin-small');
  assert.equal(fallbackAsset.fallbackForAssetKey, 'coffin_imsety');

  const uniqueAsset = getCoffinAssetForGod(imsety, createTextureScene(['coffin_imsety']));
  assert.equal(uniqueAsset.key, 'coffin_imsety');
  assert.equal(uniqueAsset.fileName, 'coffin_imsety.png');
});

test('stage resolution still maps Amun-Ra to the Amun-Ra coffin key', () => {
  const asset = getCoffinAssetForStage(14, createTextureScene(['coffin_amun_ra']));
  assert.equal(asset.godId, 'amun_ra');
  assert.equal(asset.key, 'coffin_amun_ra');
  assert.equal(asset.fileName, 'coffin_amun_ra.png');
});

test('icon resolution uses the 64px key when loaded', () => {
  const imsety = GODS[0];
  const iconAsset = getCoffinAssetForGod(
    imsety,
    createTextureScene(['coffin_imsety', 'coffin_imsety_icon_64']),
    { variant: COFFIN_ASSET_VARIANTS.ICON },
  );

  assert.equal(iconAsset.key, 'coffin_imsety_icon_64');
  assert.equal(iconAsset.variant, COFFIN_ASSET_VARIANTS.ICON);
  assert.equal(iconAsset.path, 'assets/images/coffins/icons/coffin_imsety_icon_64.png');
});

test('icon resolution falls back to the matching high-resolution god coffin', () => {
  const anubis = GODS.find((god) => god.id === 'anubis');
  const iconAsset = getCoffinAssetForGod(
    anubis,
    createTextureScene(['coffin_anubis']),
    { variant: COFFIN_ASSET_VARIANTS.ICON },
  );

  assert.equal(iconAsset.key, 'coffin_anubis');
  assert.equal(iconAsset.fallbackForAssetKey, 'coffin_anubis_icon_64');
  assert.equal(iconAsset.requestedVariant, COFFIN_ASSET_VARIANTS.ICON);
});

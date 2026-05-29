import assert from 'node:assert/strict';
import test from 'node:test';

import { getAssetBasePath, resolveAssetPath } from '../docs/src/data/assetPaths.js';

test('asset paths default to docs-local assets directory', () => {
  delete globalThis.window;

  assert.equal(getAssetBasePath(), 'assets');
  assert.equal(resolveAssetPath('images/pieces/liver.png'), 'assets/images/pieces/liver.png');
});

test('asset paths can point public-test builds at shared parent assets', () => {
  globalThis.window = { DUAT_ASSET_BASE_PATH: '../assets/' };

  assert.equal(getAssetBasePath(), '../assets');
  assert.equal(resolveAssetPath('/audio/bgm/bgm_tier1_normal.mp3'), '../assets/audio/bgm/bgm_tier1_normal.mp3');

  delete globalThis.window;
});

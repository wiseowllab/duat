import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const mainSource = await readFile(new URL('../docs/src/main.js', import.meta.url), 'utf8');
const gameSceneSource = await readFile(new URL('../docs/src/scenes/GameScene.js', import.meta.url), 'utf8');

test('global pixel-art rendering remains enabled for board pieces', () => {
  assert.match(mainSource, /pixelArt: true/);
});

test('result images opt into linear filtering without changing the global renderer', () => {
  const helperSource = gameSceneSource.match(
    /createSmoothResultImage\(x, y, textureKey\)[\s\S]*?\n  }/,
  )?.[0];

  assert.ok(helperSource, 'smooth result image helper should be present');
  assert.match(helperSource, /Phaser\.Textures\.FilterMode\.LINEAR/);
  assert.match(helperSource, /return this\.add\.image\(x, y, textureKey\)/);

  [
    /createSmoothResultImage\(0, bottomY, RESULT_PYRAMID_COMPLETE_ASSET\.key\)/,
    /createSmoothResultImage\(0, 0, textureKey\)/,
    /createSmoothResultImage\(0, layout\.centerY, layout\.asset\.key\)/,
    /createSmoothResultImage\(0, 0, skyAsset\.key\)/,
    /createSmoothResultImage\(0, 0, this\.getResultDisplayTextureKey\(RESULT_SPHINX_GUARDIAN_ASSET\.key\)\)/,
    /createSmoothResultImage\(0, 0, displayTextureKey\)/,
  ].forEach((pattern) => {
    assert.match(gameSceneSource, pattern);
  });
});

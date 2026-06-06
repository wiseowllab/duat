import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const mainSource = await readFile(new URL('../docs/src/main.js', import.meta.url), 'utf8');
const gameSceneSource = await readFile(new URL('../docs/src/scenes/GameScene.js', import.meta.url), 'utf8');

test('global pixel-art rendering remains enabled for board pieces', () => {
  assert.match(mainSource, /pixelArt: true/);
});

test('high-resolution result illustrations opt into linear filtering without changing the global renderer', () => {
  const helperSource = gameSceneSource.match(
    /createSmoothResultImage\(x, y, textureKey\)[\s\S]*?\n  }/,
  )?.[0];

  assert.ok(helperSource, 'smooth result image helper should be present');
  assert.match(helperSource, /Phaser\.Textures\.FilterMode\.LINEAR/);
  assert.match(helperSource, /return this\.add\.image\(x, y, textureKey\)/);

  [
    /createSmoothResultImage\(0, bottomY, RESULT_PYRAMID_COMPLETE_ASSET\.key\)/,
    /createSmoothResultImage\(0, layout\.centerY, layout\.asset\.key\)/,
    /createSmoothResultImage\(0, 0, skyAsset\.key\)/,
    /createSmoothResultImage\(0, 0, this\.getResultDisplayTextureKey\(RESULT_SPHINX_GUARDIAN_ASSET\.key\)\)/,
    /createSmoothResultImage\(0, 0, displayTextureKey\)/,
  ].forEach((pattern) => {
    assert.match(gameSceneSource, pattern);
  });
});

test('board pieces and result god icons retain the global crisp filtering', () => {
  const createBlockSpriteSource = gameSceneSource.match(
    /\n  createBlockSprite\(x, y, type, alpha\)[\s\S]*?\n  }/,
  )?.[0];
  const createResultGodIconSource = gameSceneSource.match(
    /\n  createResultGodIcon\(god, config\)[\s\S]*?\n  }/,
  )?.[0];

  assert.ok(createBlockSpriteSource, 'board piece image creation should be present');
  assert.ok(createResultGodIconSource, 'result god icon image creation should be present');
  assert.doesNotMatch(createBlockSpriteSource, /createSmoothResultImage/);
  assert.doesNotMatch(createResultGodIconSource, /createSmoothResultImage/);
  assert.match(createBlockSpriteSource, /this\.add\.image\(0, 0, asset\.key\)/);
  assert.match(createResultGodIconSource, /this\.add\.image\(0, 0, textureKey\)/);
});

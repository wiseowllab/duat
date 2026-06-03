import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const gameSceneSource = readFileSync(new URL('../docs/src/scenes/GameScene.js', import.meta.url), 'utf8');

test('result overlay keeps god coffin icons with temple layer and pyramid foreground separate', () => {
  const nodesLine = gameSceneSource
    .split('\n')
    .find((line) => line.includes('const nodes = [sky, temple'));

  assert.ok(nodesLine, 'result overlay nodes array should be present');
  assert.match(
    nodesLine,
    /sky, temple, resultGodIcons, skyReadabilityShade, pyramid, soulProcession, panel, statsReadabilityPanel, title, subtitle, recordText/,
  );
  assert.ok(
    nodesLine.indexOf('temple') < nodesLine.indexOf('resultGodIcons'),
    'temple must be added before coffin icons so the icons read as temple guardians',
  );
  assert.ok(
    nodesLine.indexOf('resultGodIcons') < nodesLine.indexOf('pyramid'),
    'coffin icons must be kept with the temple layer before the separate foreground pyramid',
  );
});

test('result god coffin icon positions anchor to the temple bottom edge', () => {
  assert.match(
    gameSceneSource,
    /templeBottomY: templeLayout\.visibleBottomY/,
    'result coffin icon layer should receive the temple visible bottom edge',
  );
  assert.match(
    gameSceneSource,
    /const baseY = Math\.min\(templeBottomY - basePadding, maxIconY\)/,
    'result coffin rows should be anchored from the temple bottom, with only stats overlap clamping',
  );
  assert.doesNotMatch(
    gameSceneSource,
    /createResultGodIconSideGroup/,
    'result coffin icons should no longer be split into side groups around the pyramid',
  );
});

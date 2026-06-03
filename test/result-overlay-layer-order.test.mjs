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

test('result god coffin icon positions anchor to the temple entrance sides', () => {
  assert.match(
    gameSceneSource,
    /templeBottomY: templeLayout\.visibleBottomY/,
    'result coffin icon layer should receive the temple visible bottom edge',
  );
  assert.match(
    gameSceneSource,
    /const rearY = Math\.min\(templeBottomY - basePadding, maxIconY\)/,
    'rear guardian rows should stand on the temple base and only clamp for stats overlap',
  );
  assert.match(
    gameSceneSource,
    /const frontY = Math\.min\(rearY \+ \(iconMaxHeight \* RESULT_GOD_ICON_FRONT_ROW_FORWARD_RATIO\), maxIconY\)/,
    'front guardian rows should stand slightly forward while remaining grounded',
  );
  assert.match(
    gameSceneSource,
    /getResultGodIconSidePositions\('left'/,
    'result coffin icons should include a left-side guardian group',
  );
  assert.match(
    gameSceneSource,
    /getResultGodIconSidePositions\('right'/,
    'result coffin icons should include a right-side guardian group',
  );
  assert.match(
    gameSceneSource,
    /RESULT_GOD_ICON_DOORWAY_CLEAR_WIDTH_RATIO/,
    'result coffin icons should reserve the central temple doorway',
  );
  assert.doesNotMatch(
    gameSceneSource,
    /\(index - \(\(rowCount - 1\) \/ 2\)\) \* spacing/,
    'result coffin icons should not be centered in front of the temple doorway',
  );
});

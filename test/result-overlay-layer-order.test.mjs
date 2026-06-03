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

test('result god coffin icons render as grounded statues without circular halos', () => {
  assert.match(
    gameSceneSource,
    /RESULT_GOD_ICON_SHADOW_ALPHA = 0\.48/,
    'result god statues should use a darker subtle ground shadow opacity',
  );
  assert.match(
    gameSceneSource,
    /RESULT_GOD_ICON_SHADOW_WIDTH_RATIO = 0\.96/,
    'result god statue shadow should be almost as wide as the coffin image',
  );
  assert.match(
    gameSceneSource,
    /image\.displayWidth \* RESULT_GOD_ICON_SHADOW_WIDTH_RATIO/,
    'result god statue shadow width should scale from the coffin image width',
  );
  assert.match(
    gameSceneSource,
    /RESULT_GOD_ICON_SHADOW_HEIGHT_RATIO = 0\.3/,
    'result god statue shadow should remain a grounded oval relative to the coffin image height',
  );
  assert.match(
    gameSceneSource,
    /image\.displayHeight \* RESULT_GOD_ICON_SHADOW_HEIGHT_RATIO/,
    'result god statue shadow height should scale from the coffin image height',
  );
  assert.doesNotMatch(
    gameSceneSource,
    /RESULT_GOD_ICON_GLOW_COLOR|style\.glowAlpha|glowStrokeAlpha|setStrokeStyle\(1, RESULT_GOD_ICON/,
    'result god statues should not draw circular glow or ring layers behind the coffin art',
  );
});


test('result soul procession caps icons and keeps rescued souls in side rows', () => {
  assert.match(
    gameSceneSource,
    /RESULT_SOUL_PROCESSION_MAX_ICONS = 16/,
    'result soul procession should cap large revival totals at 16 visible mummies',
  );
  assert.match(
    gameSceneSource,
    /if \(count <= 0\) return 0;/,
    'zero revived souls should render no mummy icons',
  );
  assert.match(
    gameSceneSource,
    /if \(count <= 5\) return count;/,
    'small revival totals should show one icon per rescued soul',
  );
  assert.match(
    gameSceneSource,
    /if \(count <= 15\) return Math\.min\(10, count\);/,
    'medium revival totals should form capped loose side rows',
  );
  assert.match(
    gameSceneSource,
    /if \(count <= 30\) return Math\.min\(14, count\);/,
    'large revival totals should widen without filling the whole result art',
  );
  assert.match(
    gameSceneSource,
    /RESULT_SOUL_PROCESSION_CENTER_CLEAR_RATIO = 0\.26/,
    'mummy procession should reserve a broad central ceremonial path instead of forming UI rows',
  );
  assert.match(
    gameSceneSource,
    /RESULT_SOUL_PROCESSION_SIDE_MIN_RATIO = 0\.39/,
    'mummy procession should stay in side foreground lanes away from the central pyramid body',
  );
  assert.match(
    gameSceneSource,
    /RESULT_SOUL_PROCESSION_SIDE_MAX_RATIO = 0\.47/,
    'mummy procession should use the outer panel edges for mirrored left-right placement',
  );
  assert.match(
    gameSceneSource,
    /RESULT_SOUL_PROCESSION_PYRAMID_GAP/,
    'mummy procession should be pushed below the pyramid reveal layer',
  );
  assert.match(
    gameSceneSource,
    /RESULT_SOUL_PROCESSION_SCORE_PANEL_GAP/,
    'mummy procession should keep clear of the score panel below it',
  );
  assert.match(
    gameSceneSource,
    /getResultSoulProcessionSidePositions\('left'/,
    'mummy procession should include a left path-side row',
  );
  assert.match(
    gameSceneSource,
    /getResultSoulProcessionSidePositions\('right'/,
    'mummy procession should include a right path-side row',
  );
  assert.match(
    gameSceneSource,
    /pyramidLayout,\n      statsZoneTop/,
    'mummy procession should receive pyramid and score-panel bounds for non-overlap placement',
  );
  assert.match(
    gameSceneSource,
    /pyramidBottomY \+ RESULT_SOUL_PROCESSION_PYRAMID_GAP/,
    'mummy procession rear row should begin below the pyramid bottom',
  );
  assert.match(
    gameSceneSource,
    /scorePanelTopY - RESULT_SOUL_PROCESSION_SCORE_PANEL_GAP/,
    'mummy procession foreground row should stop before the score panel',
  );
  assert.match(
    gameSceneSource,
    /startIndex: 0,\n      \}\),\n      \.\.\.this\.getResultSoulProcessionSidePositions\('right'[\s\S]*startIndex: 0,/,
    'left and right mummy lanes should use mirrored jitter rather than offset icon rows',
  );
  assert.match(
    gameSceneSource,
    /RESULT_SOUL_PROCESSION_TEMPLE_SCALE,\n        RESULT_SOUL_PROCESSION_FOREGROUND_SCALE/s,
    'mummies closer to the temple should be smaller than foreground mummies',
  );
  assert.match(
    gameSceneSource,
    /RESULT_SOUL_PROCESSION_OPACITY_MIN,\n        RESULT_SOUL_PROCESSION_OPACITY_MAX/s,
    'mummies should use subdued perspective opacity values',
  );
  assert.doesNotMatch(
    gameSceneSource,
    /createResultMummyIcon[\s\S]*setStrokeStyle\(.*RESULT_SOUL_PROCESSION/s,
    'result mummies should not add circular rings or halos',
  );
});

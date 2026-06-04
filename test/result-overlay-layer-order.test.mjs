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
    /sky, temple, resultGodIcons, skyReadabilityShade, pyramid, sphinxGuardians, soulProcession, panel, statsReadabilityPanel, title, subtitle, recordText/,
  );
  assert.ok(
    nodesLine.indexOf('temple') < nodesLine.indexOf('resultGodIcons'),
    'temple must be added before coffin icons so the icons read as temple guardians',
  );
  assert.ok(
    nodesLine.indexOf('resultGodIcons') < nodesLine.indexOf('pyramid'),
    'coffin icons must be kept with the temple layer before the separate foreground pyramid',
  );
  assert.ok(
    nodesLine.indexOf('pyramid') < nodesLine.indexOf('sphinxGuardians'),
    'complete-clear sphinx guardians should stand in front of the pyramid',
  );
  assert.ok(
    nodesLine.indexOf('sphinxGuardians') < nodesLine.indexOf('soulProcession'),
    'revived souls should remain in front of complete-clear sphinx guardians',
  );
});


test('result soul and sphinx assets preload with stable texture keys', () => {
  assert.match(
    gameSceneSource,
    /preloadResultCharacterAssets\(this\)/,
    'result character art should be preloaded by the game scene',
  );

  const characterAssetSource = readFileSync(new URL('../docs/src/data/resultCharacters.js', import.meta.url), 'utf8');
  assert.match(characterAssetSource, /key: 'result-revived-soul'/);
  assert.match(characterAssetSource, /images\/result\/souls\/revived_soul\.png/);
  assert.match(characterAssetSource, /key: 'result-golden-revived-soul'/);
  assert.match(characterAssetSource, /images\/result\/souls\/golden_revived_soul\.png/);
  assert.match(characterAssetSource, /key: 'result-sphinx-guardian'/);
  assert.match(characterAssetSource, /images\/result\/guardians\/sphinx_guardian\.png/);
});

test('complete clear upgrades result souls and adds mirrored sphinx guardians only for true end', () => {
  assert.match(
    gameSceneSource,
    /this\.currentEndingType === ENDING_TYPES\.TRUE_END\n      \? RESULT_GOLDEN_REVIVED_SOUL_ASSET\.key\n      : RESULT_REVIVED_SOUL_ASSET\.key/,
    'true end should use golden revived soul art while other endings use normal revived soul art',
  );
  assert.match(
    gameSceneSource,
    /this\.currentEndingType !== ENDING_TYPES\.TRUE_END \|\| !this\.textures\.exists\(RESULT_SPHINX_GUARDIAN_ASSET\.key\)/,
    'sphinx guardian layer should render only for true end when the asset is loaded',
  );
  assert.match(
    gameSceneSource,
    /\{ x: xOffset, flipX: true \}/,
    'right-side sphinx should be mirrored with flipX instead of requiring a second image file',
  );
  assert.match(
    gameSceneSource,
    /setFlipX\(flipX\)/,
    'sphinx guardian placement should apply flipX at render time',
  );
  assert.match(
    gameSceneSource,
    /RESULT_SOUL_ICON_GROUND_Y/,
    'soul icons should keep a grounded shadow under each image',
  );
  assert.match(
    gameSceneSource,
    /RESULT_SPHINX_SHADOW_WIDTH_RATIO/,
    'sphinx guardians should have ground shadows',
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



test('result soul procession preserves pre-procession result landmark layout constants', () => {
  assert.match(
    gameSceneSource,
    /RESULT_PYRAMID_SCALE_MULTIPLIER = 0\.84/,
    'pyramid scale should remain at the pre-procession result layout value',
  );
  assert.match(
    gameSceneSource,
    /RESULT_PYRAMID_MAX_HEIGHT_RATIO = 0\.98/,
    'pyramid max height should remain at the pre-procession result layout value',
  );
  assert.match(
    gameSceneSource,
    /RESULT_PYRAMID_BOTTOM_INSET_RATIO = 0\.14/,
    'pyramid bottom inset should remain at the pre-procession result layout value',
  );
  assert.match(
    gameSceneSource,
    /RESULT_PYRAMID_Y_OFFSET = 20/,
    'pyramid y offset should remain at the pre-procession result layout value',
  );
  assert.match(
    gameSceneSource,
    /RESULT_STATS_PANEL_TOP_RATIO = \{ standard: 0\.24, compact: 0\.2 \}/,
    'stats panel top ratio should remain at the pre-procession result layout value',
  );
  assert.match(
    gameSceneSource,
    /const statsPanelHeight = isRitualEnding\n      \? \(isCompactPanel \? 108 : 116\)\n      : \(isCompactPanel \? 94 : 108\);/,
    'stats panel height should remain at the pre-procession result layout value',
  );
});

test('result soul procession caps icons and keeps rescued souls in side rows', () => {
  assert.match(
    gameSceneSource,
    /RESULT_SOUL_PROCESSION_MAX_ICONS = 10/,
    'result soul procession should cap large revival totals at 10 readable mummies',
  );
  assert.match(
    gameSceneSource,
    /if \(count <= 0\) return 0;/,
    'zero revived souls should render no mummy icons',
  );
  assert.match(
    gameSceneSource,
    /if \(count <= 4\) return count;/,
    'small revival totals should show one readable icon per rescued soul',
  );
  assert.match(
    gameSceneSource,
    /if \(count <= 12\) return Math\.min\(6, count\);/,
    'medium revival totals should reduce to readable side rows',
  );
  assert.match(
    gameSceneSource,
    /if \(count <= 30\) return Math\.min\(8, count\);/,
    'large revival totals should prioritize fewer readable figures over quantity',
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
  assert.doesNotMatch(
    gameSceneSource,
    /pyramidLayout|pyramidBottomY|RESULT_SOUL_PROCESSION_PYRAMID_GAP/,
    'mummy procession should be positioned independently and must not read or change pyramid layout',
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
    'mummies should keep strong enough opacity for ground contrast',
  );
  assert.doesNotMatch(
    gameSceneSource,
    /createResultMummyIcon[\s\S]*setStrokeStyle\(.*RESULT_SOUL_PROCESSION/s,
    'result mummies should not add circular rings or halos',
  );
});

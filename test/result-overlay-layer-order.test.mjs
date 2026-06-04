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
    /sky, temple, sphinxGuardians, resultGodIcons, skyReadabilityShade, pyramid, soulProcession, panel, statsReadabilityPanel, title, subtitle, recordText/,
  );
  assert.ok(
    nodesLine.indexOf('temple') < nodesLine.indexOf('sphinxGuardians'),
    'temple must be added before sphinx guardians so they read as horizon temple guardians',
  );
  assert.ok(
    nodesLine.indexOf('sphinxGuardians') < nodesLine.indexOf('resultGodIcons'),
    'complete-clear sphinx guardians must sit behind the god coffin icon rows',
  );
  assert.ok(
    nodesLine.indexOf('resultGodIcons') < nodesLine.indexOf('pyramid'),
    'god coffin icons must remain behind the separate foreground pyramid',
  );
  assert.ok(
    nodesLine.indexOf('pyramid') < nodesLine.indexOf('soulProcession'),
    'revived souls should remain in front of the pyramid foreground',
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
    /RESULT_SOUL_ICON_SHADOW_WIDTH_RATIO/,
    'soul icons should keep a grounded shadow under each image',
  );
  assert.match(
    gameSceneSource,
    /RESULT_SPHINX_SHADOW_WIDTH_RATIO/,
    'sphinx guardians should have ground shadows',
  );
});


test('result souls breathe in place without vertical floating', () => {
  const soulLayerSource = gameSceneSource.match(
    /createResultSoulProcessionLayer[\s\S]*?\n  getResultSoulProcessionIconCount/,
  )?.[0];

  assert.ok(soulLayerSource, 'result soul procession layer source should be present');
  assert.match(
    soulLayerSource,
    /scaleX: 1\.03,\n        scaleY: 1\.03,/,
    'rescued souls should use a subtle scale-breathing pulse without flattening slot display heights',
  );
  assert.doesNotMatch(
    soulLayerSource,
    /\n\s*y: placement\.y -|\n\s*y: position\.y -/,
    'rescued souls should not float upward or downward on the result screen',
  );
});

test('true-end sphinx guardians sit at the temple horizon with subtle attached shadows', () => {
  assert.match(
    gameSceneSource,
    /RESULT_SPHINX_DESKTOP_DISPLAY_HEIGHT = 78/,
    'desktop sphinx guardians should be restored closer to their larger complete-clear size',
  );
  assert.match(
    gameSceneSource,
    /RESULT_SPHINX_COMPACT_DISPLAY_HEIGHT = 56/,
    'compact sphinx guardians should scale up proportionally while fitting mobile complete-clear layouts',
  );
  assert.match(
    gameSceneSource,
    /templeBottomY \+ RESULT_SPHINX_TEMPLE_BASE_Y_OFFSET/,
    'sphinx guardians should anchor near the temple base line',
  );
  assert.match(
    gameSceneSource,
    /RESULT_SPHINX_SIDE_X_RATIO = 0\.39/,
    'sphinx guardians should be pushed to the left and right sides outside the central pyramid path',
  );
  assert.match(
    gameSceneSource,
    /RESULT_SPHINX_SHADOW_ALPHA = 0\.16/,
    'sphinx guardian shadows should be subtle',
  );
  assert.match(
    gameSceneSource,
    /displayHeight \* RESULT_SPHINX_SHADOW_BASE_OFFSET_RATIO/,
    'sphinx guardian shadows should stay attached to the feet instead of projecting forward',
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
    /RESULT_GOD_ICON_SCALE_MULTIPLIER = 1\.25/,
    'result coffin icons should render 25% larger than the previous base size',
  );
  assert.match(
    gameSceneSource,
    /const iconMaxHeight = baseIconMaxHeight \* RESULT_GOD_ICON_SCALE_MULTIPLIER/,
    'result coffin icon sizing should apply the shared statue scale multiplier',
  );
  assert.match(
    gameSceneSource,
    /RESULT_GOD_ICON_ROW_Y_OFFSET = 8/,
    'result coffin icon rows should share a small downward row offset',
  );
  assert.match(
    gameSceneSource,
    /const rearY = Math\.min\(rearBaseY \+ RESULT_GOD_ICON_ROW_Y_OFFSET, maxIconY\)/,
    'rear guardian rows should sit slightly lower while still clamping for stats overlap',
  );
  assert.match(
    gameSceneSource,
    /const frontY = Math\.min\(frontBaseY \+ RESULT_GOD_ICON_ROW_Y_OFFSET, maxIconY\)/,
    'front guardian rows should sit slightly lower while remaining grounded ahead of the rear row',
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

test('result soul procession uses fixed foreground side slots', () => {
  assert.match(
    gameSceneSource,
    /RESULT_SOUL_PROCESSION_MAX_ICONS = 6/,
    'result soul procession should cap at three fixed mummy slots per side',
  );
  assert.match(
    gameSceneSource,
    /return Math\.min\(Math\.max\(0, revivedSoulsCount\), RESULT_SOUL_PROCESSION_MAX_ICONS\);/,
    'zero revived souls should render no mummies while larger counts use only fixed slots',
  );
  assert.match(
    gameSceneSource,
    /RESULT_SOUL_PROCESSION_GROUP_X_RATIO = 0\.38/,
    'mummy groups should use explicit mirrored foreground anchors',
  );
  assert.match(
    gameSceneSource,
    /const groupBaseY = statsZoneTop - RESULT_SOUL_PROCESSION_BASELINE_GAP;/,
    'front mummy baselines should be anchored just above the score panel top',
  );
  assert.match(
    gameSceneSource,
    /const leftGroupX = -panelWidth \* RESULT_SOUL_PROCESSION_GROUP_X_RATIO;/,
    'left group should use a fixed lower-left foreground anchor',
  );
  assert.match(
    gameSceneSource,
    /const rightGroupX = panelWidth \* RESULT_SOUL_PROCESSION_GROUP_X_RATIO;/,
    'right group should mirror the fixed lower-right foreground anchor',
  );
  assert.match(
    gameSceneSource,
    /getResultSoulProcessionSideFixedPlacements\('left', leftCount, leftGroupX, groupBaseY\)/,
    'mummy procession should include a left fixed-slot group',
  );
  assert.match(
    gameSceneSource,
    /getResultSoulProcessionSideFixedPlacements\('right', rightCount, rightGroupX, groupBaseY\)/,
    'mummy procession should include a right fixed-slot group',
  );
  assert.doesNotMatch(
    gameSceneSource,
    /pyramidLayout|pyramidBottomY|RESULT_SOUL_PROCESSION_PYRAMID_GAP|getResultSoulProcessionRelativePositions|getResultSoulProcessionPositions\(/,
    'mummy procession should not read pyramid dimensions or use automatic relative row distribution',
  );
  assert.doesNotMatch(
    gameSceneSource,
    /createResultMummyIcon[\s\S]*setStrokeStyle\(.*RESULT_SOUL_PROCESSION/s,
    'result mummies should not add circular rings or halos',
  );
});

test('result soul procession fixed slots preserve per-mummy perspective', () => {
  assert.match(
    gameSceneSource,
    /const RESULT_SOUL_PROCESSION_BASELINE_GAP = 28;/,
    'front mummy baseline should sit 28px above the score panel top',
  );
  assert.match(
    gameSceneSource,
    /\{ dx: -10, dy: -28, displayHeight: 34, alpha: 0\.86 \},\n  \{ dx: 10, dy: -14, displayHeight: 39, alpha: 0\.93 \},\n  \{ dx: -2, dy: 0, displayHeight: 45, alpha: 1 \}/,
    'each side should use fixed back, middle, and front slots with increasing Y and displayHeight',
  );
  assert.match(
    gameSceneSource,
    /x: groupX \+ \(sideMultiplier \* slot\.dx\),\n      y: groupBaseY \+ slot\.dy,\n      displayHeight: slot\.displayHeight,/,
    'each mummy should apply the slot X, baseline Y, and its own displayHeight explicitly',
  );
  assert.doesNotMatch(
    gameSceneSource,
    /const y = .*relativePosition|setScale\(position\.scale\)|RESULT_SOUL_ICON_DISPLAY_HEIGHT/,
    'mummies should not use relative row Y calculations, shared scales, or one shared display height',
  );
  assert.match(
    gameSceneSource,
    /flipX: side === 'right'/,
    'right-side mummy group should remain mirrored with flipX',
  );
  assert.match(
    gameSceneSource,
    /\.setOrigin\(0\.5, 1\)\n      \.setDisplaySize\(displayHeight, displayHeight\)/,
    'every mummy sprite should use bottom-center origin and its fixed slot displayHeight',
  );
});

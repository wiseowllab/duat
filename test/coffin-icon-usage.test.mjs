import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const hudSource = await readFile(new URL('../docs/src/ui/Hud.js', import.meta.url), 'utf8');
const gameSceneSource = await readFile(new URL('../docs/src/scenes/GameScene.js', import.meta.url), 'utf8');

function getMethodSource(source, methodName, nextMethodName) {
  return source.match(new RegExp(`\\n  ${methodName}\\([\\s\\S]*?\\n  ${nextMethodName}\\(`))?.[0];
}

test('HUD uses high-resolution coffin art for the current coffin display', () => {
  const source = getMethodSource(hudSource, 'drawCoffinVisual', 'createCoffinDisplay');

  assert.ok(source, 'current coffin display method should be present');
  assert.match(source, /variant: COFFIN_ASSET_VARIANTS\.HIGH/);
});

test('SHRINE and B1-B4 button state use icon coffin art', () => {
  const shrineSource = getMethodSource(hudSource, 'createShrineIcon', 'createShrineCoffinDisplay');
  const bombButtonSource = getMethodSource(hudSource, 'emitBombButtonState', 'refreshBombButtonAssets');

  assert.ok(shrineSource, 'SHRINE icon method should be present');
  assert.ok(bombButtonSource, 'bomb button state method should be present');
  assert.match(shrineSource, /variant: COFFIN_ASSET_VARIANTS\.ICON/);
  assert.match(bombButtonSource, /variant: COFFIN_ASSET_VARIANTS\.ICON/);
});

test('result god coffin statues use icon coffin art', () => {
  const source = getMethodSource(gameSceneSource, 'createResultGodIcon', 'getResultGodIconStyle');

  assert.ok(source, 'result god icon method should be present');
  assert.match(source, /variant: COFFIN_ASSET_VARIANTS\.ICON/);
});

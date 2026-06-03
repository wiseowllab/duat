import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const gameSceneSource = readFileSync(new URL('../docs/src/scenes/GameScene.js', import.meta.url), 'utf8');

test('result overlay draws pyramid before god coffin icons', () => {
  const nodesLine = gameSceneSource
    .split('\n')
    .find((line) => line.includes('const nodes = [sky, temple'));

  assert.ok(nodesLine, 'result overlay nodes array should be present');
  assert.match(
    nodesLine,
    /sky, temple, skyReadabilityShade, pyramid, resultGodIcons, soulProcession, panel, statsReadabilityPanel, title, subtitle, recordText/,
  );
  assert.ok(
    nodesLine.indexOf('pyramid') < nodesLine.indexOf('resultGodIcons'),
    'pyramid must be added before resultGodIcons so coffin icons draw above it',
  );
});

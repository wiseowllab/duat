import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { HighScoreManager } from '../docs/src/core/HighScoreManager.js';

function createStorage() {
  const values = new Map();
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    },
  };
}

function withStorage(run) {
  const originalWindow = globalThis.window;
  const storage = createStorage();
  globalThis.window = { localStorage: storage };

  try {
    run(storage);
  } finally {
    if (originalWindow === undefined) {
      delete globalThis.window;
    } else {
      globalThis.window = originalWindow;
    }
  }
}

test('complete-clear records persist the first clear and only improve lower values', () => {
  withStorage(() => {
    const manager = new HighScoreManager('duat.completeClear.test');
    const firstClear = manager.recordCompleteClear({ runTimeMs: 163000, drops: 128 });

    assert.equal(firstClear.isNewBestClearTime, true);
    assert.equal(firstClear.isNewFewestClearDrops, true);
    assert.equal(firstClear.records.bestClearTimeMs, 163000);
    assert.equal(firstClear.records.fewestClearDrops, 128);

    const fewerDrops = manager.recordCompleteClear({ runTimeMs: 180000, drops: 120 });
    assert.equal(fewerDrops.isNewBestClearTime, false);
    assert.equal(fewerDrops.isNewFewestClearDrops, true);
    assert.equal(fewerDrops.records.bestClearTimeMs, 163000);
    assert.equal(fewerDrops.records.fewestClearDrops, 120);

    const fasterTime = manager.recordCompleteClear({ runTimeMs: 150000, drops: 140 });
    assert.equal(fasterTime.isNewBestClearTime, true);
    assert.equal(fasterTime.isNewFewestClearDrops, false);
    assert.equal(fasterTime.records.bestClearTimeMs, 150000);
    assert.equal(fasterTime.records.fewestClearDrops, 120);

    const reloadedManager = new HighScoreManager('duat.completeClear.test');
    assert.equal(reloadedManager.getRecords().bestClearTimeMs, 150000);
    assert.equal(reloadedManager.getRecords().fewestClearDrops, 120);
  });
});

test('normal run recording preserves complete-clear records without updating them', () => {
  withStorage(() => {
    const manager = new HighScoreManager('duat.completeClear.normalRun.test');
    manager.recordCompleteClear({ runTimeMs: 163000, drops: 128 });

    const normalRun = manager.recordRun({
      score: 90000,
      maxChain: 8,
      maxTier: 4,
      maxGodsUnlocked: 14,
    });

    assert.equal(normalRun.records.bestClearTimeMs, 163000);
    assert.equal(normalRun.records.fewestClearDrops, 128);
  });
});

test('game scene updates and displays clear records only for the true-end result', () => {
  const source = readFileSync(new URL('../docs/src/scenes/GameScene.js', import.meta.url), 'utf8');
  const endGameSource = source.match(/endGame\(requestedEndingType[\s\S]*?\n  playGameOverAtmosphere/)?.[0];

  assert.ok(endGameSource, 'endGame source should be present');
  assert.match(
    endGameSource,
    /this\.currentEndingType === ENDING_TYPES\.TRUE_END\n\s+\? this\.recordCompleteClearForCurrentRun\(\)\n\s+: null/,
    'only the complete/congratulations true-end result should record clear performance',
  );
  assert.match(source, /`Best Time: \$\{formatRunTime\(completeClearRecords\?\.bestClearTimeMs\)\} \/ Fewest: \$\{completeClearRecords\?\.fewestClearDrops \?\? '--'\}`/);
  assert.match(source, /\? 'NEW RECORD!'/);
  assert.match(source, /\? 'NEW BEST TIME!'/);
  assert.match(source, /\? 'NEW FEWEST DROPS!'/);
});

test('result stats use compact readable rows without changing the result layout', () => {
  const source = readFileSync(new URL('../docs/src/scenes/GameScene.js', import.meta.url), 'utf8');
  const overlaySource = source.match(/showGameOverOverlay\(highScoreResult[\s\S]*?\n  createResultSkyBackground/)?.[0];

  assert.ok(overlaySource, 'result overlay source should be present');
  assert.match(overlaySource, /const statLines = \[/, 'result stats should be assembled in one lines array');
  assert.match(overlaySource, /`Score: \$\{this\.score\} \/ Best: \$\{highScoreResult\.records\.highScore\}`/);
  assert.match(overlaySource, /`Chain: \$\{this\.bestChainThisRun\} \/ Tier: \$\{this\.maxTierThisRun\} \/ Gods: \$\{this\.maxGodsUnlockedThisRun\}\/\$\{TOTAL_GOD_COUNT\}`/);
  assert.match(overlaySource, /`Time: \$\{formatRunTime\(this\.runElapsedMs\)\} \/ Drops: \$\{this\.placedPieceCount\}`/);
  assert.match(overlaySource, /statLines\.push\(completeClearRecordMessage\)/, 'record messages should receive their own line');
  assert.match(overlaySource, /`Best Time: \$\{formatRunTime\(completeClearRecords\?\.bestClearTimeMs\)\} \/ Fewest: \$\{completeClearRecords\?\.fewestClearDrops \?\? '--'\}`/);
  assert.match(overlaySource, /`Souls: \$\{this\.revivedSoulsCount\} \/ Depth: \$\{this\.currentDepthLevel\} \/ Canopic: \$\{this\.totalPureCanopicCount\}`/);
  assert.match(overlaySource, /statLines\.join\('\\n'\)/, 'result stats should be joined with explicit newlines');
  assert.match(overlaySource, /const statsLineSpacing = 4;/, 'all result variants should use readable positive line spacing');
  assert.match(overlaySource, /recordText\.setLineSpacing\(3\);/, 'overflow fallback should retain positive line spacing');
});

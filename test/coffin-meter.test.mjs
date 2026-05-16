import test from 'node:test';
import assert from 'node:assert/strict';

import { CoffinMeter } from '../docs/src/core/CoffinMeter.js';
import { ScoreSystem } from '../docs/src/core/ScoreSystem.js';

const TEST_GODS = [
  {
    id: 'imsety',
    name: 'Imsety',
    tier: 1,
    tierName: 'Small Coffin',
    coffinSize: 'small',
    requiredMeter: 100,
    futureBombType: 'vertical_clear',
    description: 'Test god.',
  },
  {
    id: 'hapy',
    name: 'Hapy',
    tier: 1,
    tierName: 'Small Coffin',
    coffinSize: 'small',
    requiredMeter: 150,
    futureBombType: 'horizontal_clear',
    description: 'Test god.',
  },
];

test('coffin meter unlocks current god and carries excess progress forward', () => {
  const meter = new CoffinMeter(TEST_GODS);

  assert.deepEqual(meter.addPoints(75), []);
  assert.equal(meter.getProgress().value, 75);
  assert.equal(meter.getCurrentGod().name, 'Imsety');

  const unlockEvents = meter.addPoints(50);

  assert.equal(unlockEvents.length, 1);
  assert.equal(unlockEvents[0].god.name, 'Imsety');
  assert.equal(meter.getUnlockedCount(), 1);
  assert.equal(meter.getCurrentGod().name, 'Hapy');
  assert.equal(meter.getProgress().value, 25);
});

test('coffin meter can finish all placeholder gods without blocking play state', () => {
  const meter = new CoffinMeter(TEST_GODS);

  const unlockEvents = meter.addPoints(1000);

  assert.equal(unlockEvents.length, 2);
  assert.equal(unlockEvents.at(-1).god.name, 'Hapy');
  assert.equal(unlockEvents.at(-1).isComplete, true);
  assert.equal(meter.isComplete(), true);
  assert.equal(meter.getState().currentGod, null);
  assert.equal(meter.getState().unlockedCount, 2);
});

test('canopic clears convert more score into coffin meter than same-type clears', () => {
  const scoreSystem = new ScoreSystem();
  const sameTypeClear = {
    clearTypes: new Set(['sameType']),
    sameTypeGroups: [Array.from({ length: 4 })],
    canopicSets: [],
  };
  const canopicClear = {
    clearTypes: new Set(['canopic']),
    sameTypeGroups: [],
    canopicSets: [Array.from({ length: 4 })],
  };

  assert.equal(scoreSystem.calculateCycleMeterPoints(sameTypeClear, 1), 25);
  assert.equal(scoreSystem.calculateCycleMeterPoints(canopicClear, 1), 200);
});

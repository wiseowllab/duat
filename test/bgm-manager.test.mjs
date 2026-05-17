import assert from 'node:assert/strict';
import test from 'node:test';

import { BGM_TRACKS, getBgmKey, getBgmPath } from '../docs/src/audio/BgmManager.js';

test('BGM mapping provides normal and danger MP3 files for all four tiers', () => {
  assert.deepEqual(BGM_TRACKS, {
    1: {
      normal: 'bgm_tier1_normal.mp3',
      danger: 'bgm_tier1_danger.mp3',
    },
    2: {
      normal: 'bgm_tier2_normal.mp3',
      danger: 'bgm_tier2_danger.mp3',
    },
    3: {
      normal: 'bgm_tier3_normal.mp3',
      danger: 'bgm_tier3_danger.mp3',
    },
    4: {
      normal: 'bgm_tier4_normal.mp3',
      danger: 'bgm_tier4_danger.mp3',
    },
  });
});

test('BGM keys and paths are selected from tier and danger state', () => {
  assert.equal(getBgmKey(1, false), 'bgm_tier1_normal');
  assert.equal(getBgmKey(1, true), 'bgm_tier1_danger');
  assert.equal(getBgmPath(4, false), 'assets/audio/bgm/bgm_tier4_normal.mp3');
  assert.equal(getBgmPath(4, true), 'assets/audio/bgm/bgm_tier4_danger.mp3');
});

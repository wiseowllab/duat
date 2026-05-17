import assert from 'node:assert/strict';
import test from 'node:test';

import { BgmManager, BGM_PAUSED_VOLUME, BGM_TRACKS, BGM_VOLUME, getBgmKey, getBgmPath } from '../docs/src/audio/BgmManager.js';

function createFakeScene({ hasAsset = true, throwOnAdd = false, throwOnPlay = false } = {}) {
  const tracks = [];
  return {
    tracks,
    cache: {
      audio: {
        exists: () => hasAsset,
      },
    },
    sound: {
      add: (key, config) => {
        if (throwOnAdd) {
          throw new Error('add failed');
        }

        const track = {
          key,
          volume: config.volume,
          isPlaying: false,
          isDestroyed: false,
          play() {
            if (throwOnPlay) {
              throw new Error('play failed');
            }
            this.isPlaying = true;
          },
          stop() {
            this.isPlaying = false;
          },
          destroy() {
            this.isDestroyed = true;
          },
          setMute(isMuted) {
            this.isMuted = isMuted;
          },
          setVolume(volume) {
            this.volume = volume;
          },
        };

        tracks.push(track);
        return track;
      },
    },
    tweens: {
      addCounter: ({ to, onUpdate, onComplete }) => {
        const tween = {
          getValue: () => to,
          isPlaying: () => false,
          stop() {},
        };
        onUpdate?.(tween);
        onComplete?.();
        return tween;
      },
    },
    time: {
      delayedCall: (_delay, callback) => callback(),
    },
  };
}


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


test('BGM default mix stays low under SFX', () => {
  assert.equal(BGM_VOLUME, 0.14);
  assert.equal(BGM_PAUSED_VOLUME, 0.03);
});

test('duck temporarily lowers current BGM and restores target volume', () => {
  const scene = createFakeScene();
  let restoreCallback = null;
  scene.time.delayedCall = (_delay, callback) => {
    restoreCallback = callback;
    return { remove() {} };
  };

  const bgm = new BgmManager(scene);
  bgm.playForState(1, false);

  bgm.duck(600, 0.45);
  assert.equal(bgm.currentTrack.volume, BGM_VOLUME * 0.45);

  restoreCallback();
  assert.equal(bgm.currentTrack.volume, BGM_VOLUME);
});

test('duck safely ignores muted or missing BGM tracks', () => {
  const scene = createFakeScene({ hasAsset: false });
  const bgm = new BgmManager(scene);

  assert.doesNotThrow(() => bgm.duck());

  bgm.currentTrack = { volume: 0.14, isDestroyed: false, setVolume(volume) { this.volume = volume; } };
  bgm.setMuted(true);
  assert.doesNotThrow(() => bgm.duck());
  assert.equal(bgm.currentTrack.volume, 0);
});

test('playForState safely ignores missing assets', () => {
  const scene = createFakeScene({ hasAsset: false });
  const bgm = new BgmManager(scene);

  assert.doesNotThrow(() => bgm.playForState(1, false));
  assert.equal(bgm.currentTrack, null);
});

test('playForState safely handles sound manager failures', () => {
  const scene = createFakeScene({ throwOnAdd: true });
  const bgm = new BgmManager(scene);

  assert.doesNotThrow(() => bgm.playForState(1, false));
  assert.equal(bgm.currentTrack, null);
});

test('playForState does not replace the current track when the next track cannot play', () => {
  const scene = createFakeScene();
  const bgm = new BgmManager(scene);
  bgm.playForState(1, true);
  const dangerTrack = bgm.currentTrack;

  scene.sound.add = (key, config) => {
    const track = {
      key,
      volume: config.volume,
      isPlaying: false,
      isDestroyed: false,
      play() { throw new Error('play failed'); },
      stop() { this.isPlaying = false; },
      destroy() { this.isDestroyed = true; },
      setMute(isMuted) { this.isMuted = isMuted; },
      setVolume(volume) { this.volume = volume; },
    };
    scene.tracks.push(track);
    return track;
  };

  assert.doesNotThrow(() => bgm.playForState(1, false));
  assert.equal(bgm.currentTrack, dangerTrack);
  assert.equal(bgm.currentKey, 'bgm_tier1_danger');
});

test('playForState switches tracks without leaving the previous track playing', () => {
  const scene = createFakeScene();
  const bgm = new BgmManager(scene);

  bgm.playForState(1, true);
  const dangerTrack = bgm.currentTrack;
  bgm.playForState(1, false);

  assert.equal(bgm.currentKey, 'bgm_tier1_normal');
  assert.equal(dangerTrack.isPlaying, false);
  assert.equal(dangerTrack.isDestroyed, true);
  assert.equal(bgm.currentTrack.isPlaying, true);
});

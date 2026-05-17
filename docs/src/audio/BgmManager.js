export const BGM_VOLUME = 0.3;
export const BGM_FADE_MS = 800;
export const BGM_PAUSED_VOLUME = 0.08;
export const BGM_BASE_PATH = 'assets/audio/bgm';

export const BGM_TRACKS = {
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
};

export function getBgmKey(tier, isDanger) {
  const safeTier = Math.max(1, Math.min(4, Number(tier) || 1));
  return `bgm_tier${safeTier}_${isDanger ? 'danger' : 'normal'}`;
}

export function getBgmPath(tier, isDanger) {
  const safeTier = Math.max(1, Math.min(4, Number(tier) || 1));
  const state = isDanger ? 'danger' : 'normal';
  return `${BGM_BASE_PATH}/${BGM_TRACKS[safeTier][state]}`;
}

export function preloadBgmAssets(scene) {
  Object.entries(BGM_TRACKS).forEach(([tier, tracks]) => {
    scene.load.audio(getBgmKey(tier, false), `${BGM_BASE_PATH}/${tracks.normal}`);
    scene.load.audio(getBgmKey(tier, true), `${BGM_BASE_PATH}/${tracks.danger}`);
  });
}

export class BgmManager {
  constructor(scene, { volume = BGM_VOLUME, fadeMs = BGM_FADE_MS, pausedVolume = BGM_PAUSED_VOLUME } = {}) {
    this.scene = scene;
    this.volume = volume;
    this.fadeMs = fadeMs;
    this.pausedVolume = pausedVolume;
    this.currentKey = null;
    this.currentTrack = null;
    this.isMuted = false;
    this.isPaused = false;
    this.fadeTweens = new Map();
  }

  setMuted(isMuted) {
    this.safeRun('setMuted', () => {
      this.isMuted = isMuted;

      if (!this.isValidTrack(this.currentTrack)) {
        return;
      }

      this.safeSetMute(this.currentTrack, isMuted);
      this.safeSetVolume(this.currentTrack, this.getTargetVolume());
    });
  }

  playForState(tier, isDanger) {
    this.safeRun('playForState', () => {
      const nextKey = getBgmKey(tier, isDanger);

      if (nextKey === this.currentKey && this.isValidTrack(this.currentTrack)) {
        this.ensureTrackPlaying(this.currentTrack, nextKey);
        this.safeSetMute(this.currentTrack, this.isMuted);
        this.fadeTrackTo(this.currentTrack, this.getTargetVolume(), Math.min(this.fadeMs, 250));
        return;
      }

      const nextTrack = this.createTrack(nextKey);
      if (!nextTrack) {
        return;
      }

      this.safeSetMute(nextTrack, this.isMuted);
      this.safeSetVolume(nextTrack, this.getTargetVolume());

      if (!this.safePlayTrack(nextTrack, nextKey)) {
        this.safeDestroyTrack(nextTrack);
        return;
      }

      const previousTrack = this.currentTrack;
      this.currentKey = nextKey;
      this.currentTrack = nextTrack;

      if (previousTrack && previousTrack !== nextTrack) {
        // Reliability is more important than crossfade polish: stop the old loop
        // immediately so a Phaser tween/audio edge case cannot block gameplay.
        this.fadeOutAndStop(previousTrack, 0);
      }
    });
  }

  pause() {
    this.safeRun('pause', () => {
      this.isPaused = true;

      if (this.isValidTrack(this.currentTrack)) {
        this.fadeTrackTo(this.currentTrack, this.getTargetVolume(), Math.min(this.fadeMs, 250));
      }
    });
  }

  resume() {
    this.safeRun('resume', () => {
      this.isPaused = false;

      if (!this.isValidTrack(this.currentTrack)) {
        return;
      }

      this.ensureTrackPlaying(this.currentTrack, this.currentKey);
      this.safeSetMute(this.currentTrack, this.isMuted);
      this.fadeTrackTo(this.currentTrack, this.getTargetVolume(), Math.min(this.fadeMs, 250));
    });
  }

  stop() {
    this.safeRun('stop', () => {
      const track = this.currentTrack;
      this.currentKey = null;
      this.currentTrack = null;
      this.isPaused = false;

      if (track) {
        this.fadeOutAndStop(track, 0);
      }
    });
  }

  createTrack(key) {
    return this.safeRun('createTrack', () => {
      if (!this.scene?.cache?.audio?.exists?.(key)) {
        console.warn(`Missing BGM asset: ${key}`);
        return null;
      }

      if (!this.scene?.sound?.add) {
        console.warn('BGM sound manager is unavailable.');
        return null;
      }

      const track = this.scene.sound.add(key, {
        loop: true,
        volume: this.getTargetVolume(),
      });

      if (!this.isValidTrack(track)) {
        console.warn(`Invalid BGM track: ${key}`);
        return null;
      }

      return track;
    }, null);
  }

  getTargetVolume() {
    if (this.isMuted) {
      return 0;
    }

    return this.isPaused ? this.pausedVolume : this.volume;
  }

  fadeTrackToTargetIfNeeded(track, duration) {
    this.safeRun('fadeTrackToTargetIfNeeded', () => {
      const targetVolume = this.getTargetVolume();

      if (Math.abs((track?.volume ?? 0) - targetVolume) <= 0.01) {
        return;
      }

      this.fadeTrackTo(track, targetVolume, duration);
    });
  }

  fadeTrackTo(track, targetVolume, duration) {
    this.safeRun('fadeTrackTo', () => {
      if (!this.isValidTrack(track)) {
        console.warn('Skipping BGM fade for an invalid track.');
        return;
      }

      this.stopFadeTween(track);
      const clampedVolume = Math.max(0, Math.min(1, Number(targetVolume) || 0));
      const safeDuration = Math.max(0, Number(duration) || 0);

      if (safeDuration === 0 || !this.scene?.tweens?.addCounter) {
        this.safeSetVolume(track, clampedVolume);
        return;
      }

      const startVolume = track.volume ?? 0;
      const tween = this.scene.tweens.addCounter({
        from: startVolume,
        to: clampedVolume,
        duration: safeDuration,
        ease: 'Sine.easeInOut',
        onUpdate: (activeTween) => {
          if (!this.isValidTrack(track)) {
            this.stopFadeTween(track);
            return;
          }

          this.safeSetVolume(track, activeTween.getValue());
        },
        onComplete: () => {
          this.fadeTweens.delete(track);
        },
      });

      if (tween) {
        this.fadeTweens.set(track, tween);
      }
    });
  }

  fadeOutAndStop(track, duration) {
    this.safeRun('fadeOutAndStop', () => {
      if (!this.isValidTrack(track)) {
        console.warn('Skipping BGM stop for an invalid track.');
        this.safeDestroyTrack(track);
        return;
      }

      const finish = () => {
        this.safeStopTrack(track);
        this.safeDestroyTrack(track);
      };

      const safeDuration = Math.max(0, Number(duration) || 0);
      if (safeDuration === 0) {
        this.stopFadeTween(track);
        this.safeSetVolume(track, 0);
        finish();
        return;
      }

      this.fadeTrackTo(track, 0, safeDuration);

      if (this.scene?.time?.delayedCall) {
        this.scene.time.delayedCall(safeDuration + 25, finish);
      } else {
        finish();
      }
    });
  }

  ensureTrackPlaying(track, key = this.currentKey) {
    if (!this.isValidTrack(track)) {
      console.warn(`Cannot play invalid BGM track: ${key ?? 'unknown'}`);
      return false;
    }

    if (track.isPlaying) {
      return true;
    }

    return this.safePlayTrack(track, key);
  }

  safePlayTrack(track, key = this.currentKey) {
    return this.safeRun('track.play', () => {
      if (!this.isValidTrack(track) || !track.play) {
        console.warn(`Cannot play BGM track: ${key ?? 'unknown'}`);
        return false;
      }

      const playResult = track.play();
      if (playResult === false) {
        console.warn(`BGM track did not start: ${key ?? 'unknown'}`);
        return false;
      }

      return true;
    }, false);
  }

  safeStopTrack(track) {
    this.safeRun('track.stop', () => {
      if (this.isValidTrack(track) && track.stop) {
        track.stop();
      }
    });
  }

  safeDestroyTrack(track) {
    this.safeRun('track.destroy', () => {
      this.stopFadeTween(track);

      if (track && !track.isDestroyed && track.destroy) {
        track.destroy();
      }
    });
  }

  safeSetMute(track, isMuted) {
    this.safeRun('track.setMute', () => {
      if (this.isValidTrack(track) && track.setMute) {
        track.setMute(isMuted);
      }
    });
  }

  safeSetVolume(track, volume) {
    this.safeRun('track.setVolume', () => {
      if (this.isValidTrack(track) && track.setVolume) {
        track.setVolume(volume);
      }
    });
  }

  stopFadeTween(track) {
    const tween = this.fadeTweens.get(track);
    if (!tween) {
      return;
    }

    this.fadeTweens.delete(track);

    if (tween.isPlaying?.()) {
      tween.stop();
      return;
    }

    if (tween.stop) {
      tween.stop();
    }
  }

  isValidTrack(track) {
    return Boolean(track && !track.isDestroyed);
  }

  safeRun(label, action, fallback = undefined) {
    try {
      return action();
    } catch (error) {
      console.warn(`BGM ${label} failed; gameplay will continue.`, error);
      return fallback;
    }
  }
}

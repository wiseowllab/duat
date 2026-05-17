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
  }

  setMuted(isMuted) {
    this.isMuted = isMuted;

    if (this.currentTrack) {
      this.currentTrack.setMute(isMuted);
      this.currentTrack.setVolume(this.getTargetVolume());
    }
  }

  playForState(tier, isDanger) {
    const nextKey = getBgmKey(tier, isDanger);

    if (nextKey === this.currentKey && this.currentTrack) {
      if (!this.currentTrack.isPlaying) {
        this.currentTrack.play();
      }

      this.currentTrack.setMute(this.isMuted);
      this.fadeTrackToTargetIfNeeded(this.currentTrack, Math.min(this.fadeMs, 250));
      return;
    }

    const previousTrack = this.currentTrack;
    this.currentKey = nextKey;
    this.currentTrack = this.createTrack(nextKey);

    if (!this.currentTrack) {
      this.currentKey = null;
      this.currentTrack = null;
      return;
    }

    this.currentTrack.setMute(this.isMuted);
    this.currentTrack.setVolume(0);
    this.currentTrack.play();
    this.fadeTrackTo(this.currentTrack, this.getTargetVolume(), this.fadeMs);

    if (previousTrack) {
      this.fadeOutAndStop(previousTrack, this.fadeMs);
    }
  }

  pause() {
    this.isPaused = true;

    if (this.currentTrack) {
      this.fadeTrackTo(this.currentTrack, this.getTargetVolume(), this.fadeMs);
    }
  }

  resume() {
    this.isPaused = false;

    if (this.currentTrack) {
      if (!this.currentTrack.isPlaying) {
        this.currentTrack.play();
      }

      this.currentTrack.setMute(this.isMuted);
      this.fadeTrackTo(this.currentTrack, this.getTargetVolume(), this.fadeMs);
    }
  }

  stop() {
    const track = this.currentTrack;
    this.currentKey = null;
    this.currentTrack = null;
    this.isPaused = false;

    if (track) {
      this.fadeOutAndStop(track, this.fadeMs);
    }
  }

  createTrack(key) {
    if (!this.scene.cache.audio.exists(key)) {
      console.warn(`Missing BGM asset: ${key}`);
      return null;
    }

    return this.scene.sound.add(key, {
      loop: true,
      volume: 0,
    });
  }

  getTargetVolume() {
    if (this.isMuted) {
      return 0;
    }

    return this.isPaused ? this.pausedVolume : this.volume;
  }

  fadeTrackToTargetIfNeeded(track, duration) {
    const targetVolume = this.getTargetVolume();

    if (Math.abs((track.volume ?? 0) - targetVolume) <= 0.01) {
      return;
    }

    this.fadeTrackTo(track, targetVolume, duration);
  }

  fadeTrackTo(track, targetVolume, duration) {
    const startVolume = track.volume ?? 0;

    this.scene.tweens.addCounter({
      from: startVolume,
      to: targetVolume,
      duration,
      ease: 'Sine.easeInOut',
      onUpdate: (tween) => {
        if (track.isDestroyed) {
          return;
        }

        track.setVolume(tween.getValue());
      },
    });
  }

  fadeOutAndStop(track, duration) {
    this.fadeTrackTo(track, 0, duration);
    this.scene.time.delayedCall(duration + 25, () => {
      if (track.isDestroyed) {
        return;
      }

      track.stop();
      track.destroy();
    });
  }
}

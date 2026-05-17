const DEFAULT_VOLUME = 0.45;
const MASTER_GAIN_RAMP_SECONDS = 0.01;

export class SoundManager {
  constructor({ volume = DEFAULT_VOLUME } = {}) {
    this.context = null;
    this.masterGain = null;
    this.isMuted = false;
    this.volume = volume;
    this.lastSoftDropAt = 0;
  }

  initialize() {
    if (this.context) {
      return this.context;
    }

    const audioHost = globalThis.window ?? globalThis;
    const AudioContextClass = audioHost.AudioContext || audioHost.webkitAudioContext;
    if (!AudioContextClass) {
      return null;
    }

    try {
      this.context = new AudioContextClass();
      this.masterGain = this.context.createGain();
      this.masterGain.gain.value = this.isMuted ? 0 : this.volume;
      this.masterGain.connect(this.context.destination);
    } catch (error) {
      this.context = null;
      this.masterGain = null;
    }

    return this.context;
  }

  resume() {
    const context = this.initialize();
    if (!context || context.state !== 'suspended') {
      return;
    }

    try {
      const resumeResult = context.resume();
      if (resumeResult?.catch) {
        resumeResult.catch(() => {});
      }
    } catch (error) {
      // Browsers may still block audio until a later user gesture.
    }
  }

  setMuted(isMuted) {
    this.isMuted = isMuted;
    this.updateMasterGain();
    return this.isMuted;
  }

  toggleMute() {
    return this.setMuted(!this.isMuted);
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    this.updateMasterGain();
  }

  updateMasterGain() {
    if (!this.masterGain || !this.context) {
      return;
    }

    const targetVolume = this.isMuted ? 0 : this.volume;
    const now = this.context.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setTargetAtTime(targetVolume, now, MASTER_GAIN_RAMP_SECONDS);
  }

  playMove() {
    this.playTone({ frequency: 330, duration: 0.035, type: 'square', gain: 0.08 });
  }

  playRotate() {
    this.playTone({ frequency: 520, duration: 0.045, type: 'triangle', gain: 0.09 });
  }

  playSoftDrop() {
    const nowMs = globalThis.performance?.now?.() ?? Date.now();
    if (nowMs - this.lastSoftDropAt < 85) {
      return;
    }

    this.lastSoftDropAt = nowMs;
    this.playTone({ frequency: 150, duration: 0.035, type: 'square', gain: 0.045 });
  }

  playHardDrop() {
    this.playNoise({ duration: 0.09, gain: 0.16, filterFrequency: 180, filterType: 'lowpass' });
    this.playTone({ frequency: 92, duration: 0.1, type: 'sine', gain: 0.12 });
  }

  playLock() {
    this.playNoise({ duration: 0.075, gain: 0.12, filterFrequency: 240, filterType: 'lowpass' });
    this.playTone({ frequency: 115, duration: 0.075, type: 'triangle', gain: 0.075 });
  }

  playClear() {
    this.playArpeggio([720, 960, 1200], 0.035, { type: 'sine', gain: 0.07, gap: 0.025 });
  }

  playCanopic() {
    this.playArpeggio([440, 660, 880, 1320], 0.08, { type: 'triangle', gain: 0.07, gap: 0.055 });
  }

  playChain(chainCount) {
    const baseFrequency = 500 + Math.min(chainCount, 8) * 55;
    this.playArpeggio([baseFrequency, baseFrequency * 1.25, baseFrequency * 1.5], 0.055, {
      type: 'sine',
      gain: 0.075,
      gap: 0.04,
    });
  }

  playBombSelect() {
    this.playTone({ frequency: 620, duration: 0.055, type: 'sine', gain: 0.065 });
  }

  playBombUse() {
    this.playNoise({ duration: 0.16, gain: 0.18, filterFrequency: 520, filterType: 'bandpass' });
    this.playTone({ frequency: 75, duration: 0.16, type: 'sawtooth', gain: 0.08 });
  }

  playGodUnlock() {
    this.playArpeggio([523.25, 659.25, 783.99, 1046.5, 1318.51], 0.11, {
      type: 'triangle',
      gain: 0.075,
      gap: 0.07,
    });
  }

  playPause() {
    this.playArpeggio([420, 315], 0.055, { type: 'sine', gain: 0.06, gap: 0.045 });
  }

  playGameOver() {
    this.playArpeggio([220, 174.61, 130.81, 98], 0.16, { type: 'triangle', gain: 0.08, gap: 0.1 });
  }

  playTone({ frequency, duration, type = 'sine', gain = 0.08, startTime = 0 }) {
    const context = this.getPlayableContext();
    if (!context) {
      return;
    }

    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    const start = context.currentTime + startTime;
    const end = start + duration;

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gainNode.gain.setValueAtTime(0.0001, start);
    gainNode.gain.exponentialRampToValueAtTime(gain, start + Math.min(0.01, duration * 0.35));
    gainNode.gain.exponentialRampToValueAtTime(0.0001, end);

    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);
    oscillator.start(start);
    oscillator.stop(end + 0.01);
  }

  playArpeggio(frequencies, noteDuration, { type = 'sine', gain = 0.07, gap = 0.04 } = {}) {
    frequencies.forEach((frequency, index) => {
      this.playTone({
        frequency,
        duration: noteDuration,
        type,
        gain,
        startTime: index * gap,
      });
    });
  }

  playNoise({ duration, gain = 0.1, filterFrequency = 400, filterType = 'lowpass' }) {
    const context = this.getPlayableContext();
    if (!context) {
      return;
    }

    const sampleCount = Math.max(1, Math.floor(context.sampleRate * duration));
    const buffer = context.createBuffer(1, sampleCount, context.sampleRate);
    const data = buffer.getChannelData(0);

    for (let index = 0; index < sampleCount; index += 1) {
      data[index] = (Math.random() * 2 - 1) * (1 - index / sampleCount);
    }

    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gainNode = context.createGain();
    const start = context.currentTime;
    const end = start + duration;

    source.buffer = buffer;
    filter.type = filterType;
    filter.frequency.setValueAtTime(filterFrequency, start);
    gainNode.gain.setValueAtTime(gain, start);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, end);

    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain);
    source.start(start);
    source.stop(end + 0.01);
  }

  getPlayableContext() {
    if (this.isMuted) {
      return null;
    }

    const context = this.initialize();
    if (!context) {
      return null;
    }

    if (context.state === 'suspended') {
      this.resume();
      if (context.state === 'suspended') {
        return null;
      }
    }

    return context;
  }
}

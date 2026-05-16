import { GODS } from '../data/gods.js';

export class CoffinMeter {
  constructor(gods = GODS) {
    this.gods = gods;
    this.currentGodIndex = 0;
    this.currentMeter = 0;
    this.unlockedGods = [];
  }

  addPoints(amount) {
    const points = Math.max(0, Math.floor(amount));
    const unlockEvents = [];

    if (points <= 0 || this.isComplete()) {
      return unlockEvents;
    }

    this.currentMeter += points;

    while (!this.isComplete() && this.currentMeter >= this.getRequiredMeter()) {
      this.currentMeter -= this.getRequiredMeter();
      unlockEvents.push(this.unlockCurrentGod());
      this.advanceGod();
    }

    if (this.isComplete()) {
      this.currentMeter = 0;
    }

    return unlockEvents;
  }

  unlockCurrentGod() {
    const god = this.getCurrentGod();
    this.unlockedGods.push(god);
    return {
      god,
      unlockedCount: this.getUnlockedCount(),
      isComplete: this.getUnlockedCount() === this.gods.length,
    };
  }

  advanceGod() {
    if (!this.isComplete()) {
      this.currentGodIndex += 1;
    }
  }

  fillCurrentGod() {
    if (this.isComplete()) {
      return [];
    }

    const pointsNeeded = this.getRequiredMeter() - this.currentMeter;
    return this.addPoints(pointsNeeded);
  }

  reset() {
    this.currentGodIndex = 0;
    this.currentMeter = 0;
    this.unlockedGods = [];
  }

  getCurrentGod() {
    return this.gods[this.currentGodIndex] ?? null;
  }

  getCurrentTier() {
    const currentGod = this.getCurrentGod();
    return currentGod
      ? { tier: currentGod.tier, tierName: currentGod.tierName, coffinSize: currentGod.coffinSize }
      : { tier: 4, tierName: 'Duat Complete', coffinSize: 'maximum' };
  }

  getProgress() {
    const required = this.getRequiredMeter();
    const value = this.isComplete() ? required : this.currentMeter;

    return {
      value,
      required,
      ratio: required > 0 ? value / required : 1,
    };
  }

  getRequiredMeter() {
    return this.getCurrentGod()?.requiredMeter ?? 0;
  }

  getUnlockedGods() {
    return [...this.unlockedGods];
  }

  getUnlockedCount() {
    return this.unlockedGods.length;
  }

  isComplete() {
    return this.currentGodIndex >= this.gods.length;
  }

  getState() {
    return {
      currentGod: this.getCurrentGod(),
      currentTier: this.getCurrentTier(),
      progress: this.getProgress(),
      unlockedGods: this.getUnlockedGods(),
      unlockedCount: this.getUnlockedCount(),
      totalGods: this.gods.length,
      isComplete: this.isComplete(),
    };
  }
}

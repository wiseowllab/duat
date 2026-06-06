const STORAGE_KEY = 'duat.highScore.v1';

const DEFAULT_RECORDS = Object.freeze({
  highScore: 0,
  maxChain: 0,
  maxTier: 0,
  maxGodsUnlocked: 0,
  bestRunDate: null,
  bestClearTimeMs: null,
  fewestClearDrops: null,
});

function toSafeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : 0;
}

function toSafeClearRecord(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? Math.floor(number) : null;
}

export class HighScoreManager {
  constructor(storageKey = STORAGE_KEY) {
    this.storageKey = storageKey;
    this.storage = this.getStorage();
  }

  getRecords() {
    if (!this.storage) {
      return { ...DEFAULT_RECORDS };
    }

    try {
      const savedValue = this.storage.getItem(this.storageKey);
      if (!savedValue) {
        return { ...DEFAULT_RECORDS };
      }

      return this.normalizeRecords(JSON.parse(savedValue));
    } catch (error) {
      console.warn('High score data could not be read; using defaults.', error);
      return { ...DEFAULT_RECORDS };
    }
  }

  recordRun(runValues) {
    const previousRecords = this.getRecords();
    const nextRecords = { ...previousRecords };
    const updatedFields = [];

    this.updateRecordField(nextRecords, updatedFields, 'highScore', runValues.score);
    this.updateRecordField(nextRecords, updatedFields, 'maxChain', runValues.maxChain);
    this.updateRecordField(nextRecords, updatedFields, 'maxTier', runValues.maxTier);
    this.updateRecordField(nextRecords, updatedFields, 'maxGodsUnlocked', runValues.maxGodsUnlocked);

    if (updatedFields.length > 0) {
      nextRecords.bestRunDate = new Date().toISOString();
      this.saveRecords(nextRecords);
    }

    return {
      records: nextRecords,
      previousRecords,
      updatedFields,
      isNewHighScore: updatedFields.includes('highScore'),
      didUpdateAnyRecord: updatedFields.length > 0,
    };
  }

  recordCompleteClear(clearValues) {
    const previousRecords = this.getRecords();
    const nextRecords = { ...previousRecords };
    const updatedFields = [];

    this.updateLowerRecordField(nextRecords, updatedFields, 'bestClearTimeMs', clearValues.runTimeMs);
    this.updateLowerRecordField(nextRecords, updatedFields, 'fewestClearDrops', clearValues.drops);

    if (updatedFields.length > 0) {
      this.saveRecords(nextRecords);
    }

    return {
      records: nextRecords,
      previousRecords,
      updatedFields,
      isNewBestClearTime: updatedFields.includes('bestClearTimeMs'),
      isNewFewestClearDrops: updatedFields.includes('fewestClearDrops'),
      didUpdateAnyRecord: updatedFields.length > 0,
    };
  }

  updateRecordField(records, updatedFields, fieldName, value) {
    const safeValue = toSafeNumber(value);
    if (safeValue > records[fieldName]) {
      records[fieldName] = safeValue;
      updatedFields.push(fieldName);
    }
  }

  updateLowerRecordField(records, updatedFields, fieldName, value) {
    const safeValue = toSafeClearRecord(value);
    if (safeValue !== null && (records[fieldName] === null || safeValue < records[fieldName])) {
      records[fieldName] = safeValue;
      updatedFields.push(fieldName);
    }
  }

  saveRecords(records) {
    if (!this.storage) {
      return false;
    }

    try {
      this.storage.setItem(this.storageKey, JSON.stringify(this.normalizeRecords(records)));
      return true;
    } catch (error) {
      console.warn('High score data could not be saved.', error);
      return false;
    }
  }

  normalizeRecords(records = {}) {
    return {
      highScore: toSafeNumber(records.highScore),
      maxChain: toSafeNumber(records.maxChain),
      maxTier: toSafeNumber(records.maxTier),
      maxGodsUnlocked: toSafeNumber(records.maxGodsUnlocked),
      bestRunDate: typeof records.bestRunDate === 'string' ? records.bestRunDate : null,
      bestClearTimeMs: toSafeClearRecord(records.bestClearTimeMs),
      fewestClearDrops: toSafeClearRecord(records.fewestClearDrops),
    };
  }

  getStorage() {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return null;
      }

      const testKey = `${this.storageKey}.test`;
      window.localStorage.setItem(testKey, '1');
      window.localStorage.removeItem(testKey);
      return window.localStorage;
    } catch (error) {
      console.warn('localStorage is unavailable; high scores will not persist.', error);
      return null;
    }
  }
}

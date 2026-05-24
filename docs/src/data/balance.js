// Prototype tuning values for DUAT's current playable balance pass.
// These values are intentionally centralized so future balance passes can safely adjust pacing,
// scoring, unlock speed, and danger pressure without digging through gameplay systems.

export const PIECE_WEIGHTS = {
  liver: 20,
  lung: 20,
  stomach: 20,
  intestine: 20,
  heart: 8,
  // brain is no longer generated from the normal weighted organ pool.
  // keep this at 0 (or omit brain entirely) so regular pair generation stays organ/heart-focused.
  brain: 0,
};

// brain now appears as an occasional falling obstacle rather than a normal pool candidate.
// tune this value to raise/lower board pressure from obstacle spawns.
export const BRAIN_OBSTACLE_CHANCE = 0.08;

export const FALL_SPEED = {
  normalMs: 700,
  softDropMs: 70,
  lockDelayMs: 350,
};

export const SCORING = {
  sameTypeBaseScore: 100,
  sameTypeExtraPieceScore: 25,
  canopicSetBaseScore: 500,
  canopicExtraPieceScore: 50,
  adjacentBrainBonusScore: 100,
  sameCycleBonusMultiplier: 2,
  bombs: {
    vertical_clear: { scorePerPiece: 25, bonusScore: 0 },
    horizontal_clear: { scorePerPiece: 25, bonusScore: 0 },
    cross_clear: { scorePerPiece: 25, bonusScore: 0 },
    surround_clear: { scorePerPiece: 25, bonusScore: 0 },
    brain_clear: { scorePerPiece: 50, bonusScore: 0 },
    knowledge_convert: { scorePerPiece: 25, bonusScore: 0 },
    protective_clear: { scorePerPiece: 35, bonusScore: 0 },
    war_burst: { scorePerPiece: 40, bonusScore: 0 },
    triple_column_clear: { scorePerPiece: 45, bonusScore: 0 },
    piece_transform: { scorePerPiece: 35, bonusScore: 0 },
    half_board_reset: { scorePerPiece: 30, bonusScore: 0 },
    chaos_clear: { scorePerPiece: 50, bonusScore: 0 },
    full_board_clear: { scorePerPiece: 40, bonusScore: 0 },
    maximum_coffin_burst: { scorePerPiece: 60, bonusScore: 1000 },
  },
};

export const COFFIN_METER = {
  sameTypeGainRatio: 0.25,
  canopicGainRatio: 0.45,
  bombGainRatio: 0.15,
  requiredByTier: {
    1: 900,
    2: 1400,
    3: 2200,
    4: 3200,
  },
};

export const DANGER_BGM = {
  enterRow: 3,
  exitRow: 5,
};

export const BOMB_STOCK = {
  maxStock: 4,
};

export const UNDERWORLD_DEPTH = {
  maxLevel: 3,
  pureCanopicThresholds: [0, 3, 7],
};

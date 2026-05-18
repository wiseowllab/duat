import { COFFIN_METER, SCORING } from '../data/balance.js';

export class ScoreSystem {
  calculateClearScore(groups, chainNumber) {
    const baseScore = groups.reduce((total, group) => total + this.calculateSameTypeGroupScore(group.length), 0);
    return baseScore * chainNumber;
  }

  calculateCycleScore(clearResult, chainNumber) {
    let baseScore = 0;

    baseScore += clearResult.sameTypeGroups.reduce(
      (total, group) => total + this.calculateSameTypeGroupScore(group.length),
      0,
    );
    baseScore += clearResult.canopicSets.reduce(
      (total, group) => total + this.calculateCanopicSetScore(group.length),
      0,
    );

    if (clearResult.clearTypes.has('sameType') && clearResult.clearTypes.has('canopic')) {
      baseScore *= SCORING.sameCycleBonusMultiplier;
    }

    baseScore += this.calculateAdjacentBrainBonusScore(clearResult);

    return baseScore * chainNumber;
  }

  calculateCycleMeterPoints(clearResult, chainNumber) {
    const hasSameType = clearResult.clearTypes.has('sameType');
    const hasCanopic = clearResult.clearTypes.has('canopic');
    const sameCycleMultiplier = hasSameType && hasCanopic ? SCORING.sameCycleBonusMultiplier : 1;
    const sameTypeScore = clearResult.sameTypeGroups.reduce(
      (total, group) => total + this.calculateSameTypeGroupScore(group.length),
      0,
    ) * sameCycleMultiplier * chainNumber;
    const canopicScore = clearResult.canopicSets.reduce(
      (total, group) => total + this.calculateCanopicSetScore(group.length),
      0,
    ) * sameCycleMultiplier * chainNumber;

    return Math.floor(sameTypeScore * COFFIN_METER.sameTypeGainRatio + canopicScore * COFFIN_METER.canopicGainRatio);
  }

  calculateSameTypeGroupScore(pieceCount) {
    if (pieceCount < 4) {
      return 0;
    }

    return SCORING.sameTypeBaseScore + (pieceCount - 4) * SCORING.sameTypeExtraPieceScore;
  }

  calculateGroupScore(pieceCount) {
    return this.calculateSameTypeGroupScore(pieceCount);
  }

  calculateCanopicSetScore(pieceCount) {
    return SCORING.canopicSetBaseScore + Math.max(0, pieceCount - 4) * SCORING.canopicExtraPieceScore;
  }

  calculateAdjacentBrainBonusScore(clearResult) {
    return clearResult.adjacentBrainBonusCell ? SCORING.adjacentBrainBonusScore : 0;
  }
}

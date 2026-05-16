const CANOPIC_SET_SCORE = 500;
const CANOPIC_EXTRA_PIECE_SCORE = 50;
const SAME_CYCLE_BONUS_MULTIPLIER = 2;

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
      baseScore *= SAME_CYCLE_BONUS_MULTIPLIER;
    }

    return baseScore * chainNumber;
  }

  calculateCycleMeterPoints(clearResult, chainNumber) {
    const hasSameType = clearResult.clearTypes.has('sameType');
    const hasCanopic = clearResult.clearTypes.has('canopic');
    const sameCycleMultiplier = hasSameType && hasCanopic ? SAME_CYCLE_BONUS_MULTIPLIER : 1;
    const sameTypeScore = clearResult.sameTypeGroups.reduce(
      (total, group) => total + this.calculateSameTypeGroupScore(group.length),
      0,
    ) * sameCycleMultiplier * chainNumber;
    const canopicScore = clearResult.canopicSets.reduce(
      (total, group) => total + this.calculateCanopicSetScore(group.length),
      0,
    ) * sameCycleMultiplier * chainNumber;

    return Math.floor(sameTypeScore * 0.25 + canopicScore * 0.4);
  }

  calculateSameTypeGroupScore(pieceCount) {
    if (pieceCount < 4) {
      return 0;
    }

    return 100 + (pieceCount - 4) * 25;
  }

  calculateGroupScore(pieceCount) {
    return this.calculateSameTypeGroupScore(pieceCount);
  }

  calculateCanopicSetScore(pieceCount) {
    return CANOPIC_SET_SCORE + Math.max(0, pieceCount - 4) * CANOPIC_EXTRA_PIECE_SCORE;
  }
}

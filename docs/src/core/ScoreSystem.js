export class ScoreSystem {
  calculateClearScore(groups, chainNumber) {
    const baseScore = groups.reduce((total, group) => total + this.calculateGroupScore(group.length), 0);
    return baseScore * chainNumber;
  }

  calculateGroupScore(pieceCount) {
    if (pieceCount < 4) {
      return 0;
    }

    return 100 + (pieceCount - 4) * 25;
  }
}

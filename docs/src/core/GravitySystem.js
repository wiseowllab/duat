export class GravitySystem {
  constructor(board) {
    this.board = board;
  }

  canFall(piece) {
    return this.board.canPlace(piece.moved(0, 1));
  }

  getDropDistance(piece) {
    let distance = 0;
    let testPiece = piece;

    while (this.canFall(testPiece)) {
      distance += 1;
      testPiece = testPiece.moved(0, 1);
    }

    return distance;
  }
}

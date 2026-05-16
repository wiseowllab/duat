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

  applyBoardGravity() {
    let movedPieces = 0;

    for (let col = 0; col < this.board.columns; col += 1) {
      movedPieces += this.collapseColumn(col);
    }

    return movedPieces;
  }

  collapseColumn(col) {
    const pieces = [];

    for (let row = this.board.rows - 1; row >= 0; row -= 1) {
      const type = this.board.getCell(col, row);
      if (type) {
        pieces.push(type);
      }
    }

    let movedPieces = 0;

    for (let row = this.board.rows - 1; row >= 0; row -= 1) {
      const nextType = pieces[this.board.rows - 1 - row] ?? null;
      if (this.board.getCell(col, row) !== nextType) {
        movedPieces += nextType ? 1 : 0;
        this.board.setCell(col, row, nextType);
      }
    }

    return movedPieces;
  }
}

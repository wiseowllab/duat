const OFFSETS = [
  { col: 0, row: -1 },
  { col: 1, row: 0 },
  { col: 0, row: 1 },
  { col: -1, row: 0 },
];

export class Piece {
  constructor(types, col, row, rotation = 0) {
    this.types = types;
    this.col = col;
    this.row = row;
    this.rotation = rotation;
  }

  getCells() {
    const offset = OFFSETS[this.rotation];

    return [
      { col: this.col, row: this.row, type: this.types[0], part: 'pivot' },
      {
        col: this.col + offset.col,
        row: this.row + offset.row,
        type: this.types[1],
        part: 'satellite',
      },
    ];
  }

  moved(deltaCol, deltaRow) {
    return new Piece(this.types, this.col + deltaCol, this.row + deltaRow, this.rotation);
  }

  rotated() {
    return new Piece(this.types, this.col, this.row, (this.rotation + 1) % OFFSETS.length);
  }
}

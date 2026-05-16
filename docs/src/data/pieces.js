export const PIECE_TYPES = [
  'liver',
  'lung',
  'stomach',
  'intestine',
  'heart',
  'brain',
];

export const PIECE_COLORS = {
  liver: 0xb84a39,
  lung: 0x5f8dd3,
  stomach: 0xd68b31,
  intestine: 0x9b62c9,
  heart: 0xd94261,
  brain: 0xd9c8a3,
};

export const PIECE_LABELS = {
  liver: 'Liver',
  lung: 'Lung',
  stomach: 'Stomach',
  intestine: 'Intestine',
  heart: 'Heart',
  brain: 'Brain',
};

export function randomPieceType() {
  const index = Math.floor(Math.random() * PIECE_TYPES.length);
  return PIECE_TYPES[index];
}

export function createRandomPairTypes() {
  return [randomPieceType(), randomPieceType()];
}

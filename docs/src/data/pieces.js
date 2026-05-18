import { PIECE_WEIGHTS } from './balance.js';

export const CANOPIC_ORGAN_TYPES = [
  'liver',
  'lung',
  'stomach',
  'intestine',
];

export const HEART_TYPE = 'heart';
export const BRAIN_TYPE = 'brain';

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
  liver: '肝臓',
  lung: '肺',
  stomach: '胃',
  intestine: '腸',
  heart: '心臓',
  brain: '脳',
};

export const PIECE_ASSETS = {
  liver: {
    key: 'piece-liver',
    path: 'assets/images/pieces/liver.png',
  },
  lung: {
    key: 'piece-lung',
    path: 'assets/images/pieces/lung.png',
  },
  stomach: {
    key: 'piece-stomach',
    path: 'assets/images/pieces/stomach.png',
  },
  intestine: {
    key: 'piece-intestine',
    path: 'assets/images/pieces/intestine.png',
  },
  heart: {
    key: 'piece-heart',
    path: 'assets/images/pieces/heart.png',
  },
  brain: {
    key: 'piece-brain',
    path: 'assets/images/pieces/brain.png',
  },
};

export function getPieceAsset(type) {
  return PIECE_ASSETS[type] ?? null;
}

export function preloadPieceAssets(scene) {
  PIECE_TYPES.forEach((type) => {
    const asset = getPieceAsset(type);

    if (asset.path.endsWith('.svg')) {
      scene.load.svg(asset.key, asset.path);
      return;
    }

    scene.load.image(asset.key, asset.path);
  });
}

export function randomPieceType() {
  const weightedTypes = PIECE_TYPES
    .map((type) => ({ type, weight: Math.max(0, PIECE_WEIGHTS[type] ?? 0) }))
    .filter(({ weight }) => weight > 0);
  const totalWeight = weightedTypes.reduce((total, { weight }) => total + weight, 0);

  if (totalWeight <= 0) {
    const index = Math.floor(Math.random() * PIECE_TYPES.length);
    return PIECE_TYPES[index];
  }

  let roll = Math.random() * totalWeight;
  for (const { type, weight } of weightedTypes) {
    roll -= weight;
    if (roll < 0) {
      return type;
    }
  }

  return weightedTypes[weightedTypes.length - 1].type;
}

export function createRandomPairTypes() {
  return [randomPieceType(), randomPieceType()];
}

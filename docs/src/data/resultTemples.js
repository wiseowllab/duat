import { resolveAssetPath } from './assetPaths.js';

export const RESULT_TEMPLE_ASSETS = [
  {
    key: 'result-temple-0-ruins',
    fileName: 'temple_0_ruins.png',
    path: resolveAssetPath('images/result/temple/temple_0_ruins.png'),
    minGods: 0,
    maxGods: 2,
  },
  {
    key: 'result-temple-1-small',
    fileName: 'temple_1_small.png',
    path: resolveAssetPath('images/result/temple/temple_1_small.png'),
    minGods: 3,
    maxGods: 5,
  },
  {
    key: 'result-temple-2-medium',
    fileName: 'temple_2_medium.png',
    path: resolveAssetPath('images/result/temple/temple_2_medium.png'),
    minGods: 6,
    maxGods: 8,
  },
  {
    key: 'result-temple-3-great',
    fileName: 'temple_3_great.png',
    path: resolveAssetPath('images/result/temple/temple_3_great.png'),
    minGods: 9,
    maxGods: 12,
  },
  {
    key: 'result-temple-4-complete',
    fileName: 'temple_4_complete.png',
    path: resolveAssetPath('images/result/temple/temple_4_complete.png'),
    minGods: 13,
    maxGods: 14,
  },
];

export function normalizeUnlockedGodCount(unlockedGodCount) {
  return Math.min(14, Math.max(0, Math.floor(Number(unlockedGodCount) || 0)));
}

export function getResultTempleAsset(unlockedGodCount) {
  const normalizedCount = normalizeUnlockedGodCount(unlockedGodCount);

  return RESULT_TEMPLE_ASSETS.find((asset) => (
    normalizedCount >= asset.minGods && normalizedCount <= asset.maxGods
  )) ?? RESULT_TEMPLE_ASSETS[0];
}

export function preloadResultTempleAssets(scene) {
  RESULT_TEMPLE_ASSETS.forEach((asset) => {
    scene.load.image(asset.key, asset.path);
  });
}

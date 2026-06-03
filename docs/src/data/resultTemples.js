import { resolveAssetPath } from './assetPaths.js';

export const RESULT_TEMPLE_ASSETS = [
  {
    key: 'result-temple-0-ruins',
    fileName: 'temple_0_ruins.png',
    path: resolveAssetPath('images/result/temple/temple_0_ruins.png'),
    minGods: 0,
    maxGods: 2,
    visibleBounds: { left: 13, top: 805, right: 927, bottom: 1473 },
  },
  {
    key: 'result-temple-1-small',
    fileName: 'temple_1_small.png',
    path: resolveAssetPath('images/result/temple/temple_1_small.png'),
    minGods: 3,
    maxGods: 5,
    visibleBounds: { left: 108, top: 821, right: 836, bottom: 1496 },
  },
  {
    key: 'result-temple-2-medium',
    fileName: 'temple_2_medium.png',
    path: resolveAssetPath('images/result/temple/temple_2_medium.png'),
    minGods: 6,
    maxGods: 8,
    visibleBounds: { left: 34, top: 714, right: 908, bottom: 1457 },
  },
  {
    key: 'result-temple-3-great',
    fileName: 'temple_3_great.png',
    path: resolveAssetPath('images/result/temple/temple_3_great.png'),
    minGods: 9,
    maxGods: 12,
    visibleBounds: { left: 3, top: 642, right: 940, bottom: 1477 },
  },
  {
    key: 'result-temple-4-complete',
    fileName: 'temple_4_complete.png',
    path: resolveAssetPath('images/result/temple/temple_4_complete.png'),
    minGods: 13,
    maxGods: 14,
    visibleBounds: { left: 0, top: 619, right: 940, bottom: 1470 },
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

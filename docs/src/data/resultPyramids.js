import { resolveAssetPath } from './assetPaths.js';
import { TOTAL_GOD_COUNT } from './gods.js';

export const RESULT_PYRAMID_COMPLETE_ASSET = {
  key: 'result-pyramid-complete',
  fileName: 'pyramid_complete.png',
  path: resolveAssetPath('images/result/pyramid/pyramid_complete.png'),
};

export function normalizePreservedGodCount(preservedGodCount) {
  return Math.min(TOTAL_GOD_COUNT, Math.max(0, Math.floor(Number(preservedGodCount) || 0)));
}

export function getResultPyramidRevealRatio(preservedGodCount) {
  const count = normalizePreservedGodCount(preservedGodCount);

  if (count <= 1) return 0;
  if (count <= 3) return 0.2;
  if (count <= 5) return 0.35;
  if (count <= 7) return 0.5;
  if (count <= 9) return 0.65;
  if (count <= 11) return 0.8;
  if (count <= 13) return 0.92;
  return 1;
}

export function preloadResultPyramidAssets(scene) {
  scene.load.image(RESULT_PYRAMID_COMPLETE_ASSET.key, RESULT_PYRAMID_COMPLETE_ASSET.path);
}

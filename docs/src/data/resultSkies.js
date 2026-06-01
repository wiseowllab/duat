import { resolveAssetPath } from './assetPaths.js';

export const RESULT_SKY_ASSETS = {
  1: {
    key: 'result-sky-tier-1-night',
    fileName: 'sky_tier1_night.png',
    path: resolveAssetPath('images/result/sky/sky_tier1_night.png'),
  },
  2: {
    key: 'result-sky-tier-2-starry',
    fileName: 'sky_tier2_starry.png',
    path: resolveAssetPath('images/result/sky/sky_tier2_starry.png'),
  },
  3: {
    key: 'result-sky-tier-3-dawn',
    fileName: 'sky_tier3_dawn.png',
    path: resolveAssetPath('images/result/sky/sky_tier3_dawn.png'),
  },
  4: {
    key: 'result-sky-tier-4-sunrise',
    fileName: 'sky_tier4_sunrise.png',
    path: resolveAssetPath('images/result/sky/sky_tier4_sunrise.png'),
  },
};

export function normalizeResultSkyTier(tier) {
  return Math.min(4, Math.max(1, Math.floor(Number(tier) || 1)));
}

export function getResultSkyAsset(tier) {
  return RESULT_SKY_ASSETS[normalizeResultSkyTier(tier)];
}

export function preloadResultSkyAssets(scene) {
  Object.values(RESULT_SKY_ASSETS).forEach((asset) => {
    scene.load.image(asset.key, asset.path);
  });
}

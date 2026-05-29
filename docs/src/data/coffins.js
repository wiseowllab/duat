import { resolveAssetPath } from './assetPaths.js';
import { GODS } from './gods.js';

export const LEGACY_COFFIN_ASSETS = {
  small: {
    key: 'coffin-small',
    fileName: 'coffin_small.png',
    path: resolveAssetPath('images/coffins/coffin_small.png'),
    tierName: 'Small Coffin',
    label: 'T1 Small',
    fallbackWidth: 76,
    fallbackHeight: 116,
    maxDisplayWidth: 158,
    maxDisplayHeight: 142,
  },
  medium: {
    key: 'coffin-medium',
    fileName: 'coffin_medium.png',
    path: resolveAssetPath('images/coffins/coffin_medium.png'),
    tierName: 'Medium Coffin',
    label: 'T2 Medium',
    fallbackWidth: 84,
    fallbackHeight: 124,
    maxDisplayWidth: 158,
    maxDisplayHeight: 142,
  },
  large: {
    key: 'coffin-large',
    fileName: 'coffin_large.png',
    path: resolveAssetPath('images/coffins/coffin_large.png'),
    tierName: 'Large Coffin',
    label: 'T3 Large',
    fallbackWidth: 92,
    fallbackHeight: 132,
    maxDisplayWidth: 158,
    maxDisplayHeight: 142,
  },
  maximum: {
    key: 'coffin-maximum',
    fileName: 'coffin_maximum.png',
    path: resolveAssetPath('images/coffins/coffin_maximum.png'),
    tierName: 'Maximum Coffin',
    label: 'T4 Max',
    fallbackWidth: 100,
    fallbackHeight: 140,
    maxDisplayWidth: 158,
    maxDisplayHeight: 142,
  },
};

// Keep the existing GitHub Pages asset convention under docs/assets/images/.
// Future coffin PNG replacements should be added as:
// docs/assets/images/coffins/coffin_01.png ... coffin_14.png
const STAGE_COFFIN_DIRECTORY = 'images/coffins';
const OPTIONAL_STAGE_COFFIN_KEYS = new Set();
const warnedFallbackKeys = new Set();

function formatStageNumber(stage) {
  return String(stage).padStart(2, '0');
}

function createStageCoffinAsset(god, index) {
  const stage = index + 1;
  const fileName = `coffin_${formatStageNumber(stage)}.png`;
  const fallbackAsset = getCoffinAsset(god.coffinSize);
  const assetKey = `coffin_${formatStageNumber(stage)}`;
  OPTIONAL_STAGE_COFFIN_KEYS.add(assetKey);

  return {
    stage,
    godId: god.id,
    assetKey,
    key: assetKey,
    fileName,
    path: resolveAssetPath(`${STAGE_COFFIN_DIRECTORY}/${fileName}`),
    fallbackKey: fallbackAsset.key,
    fallbackAsset,
    fallbackWidth: fallbackAsset.fallbackWidth,
    fallbackHeight: fallbackAsset.fallbackHeight,
    maxDisplayWidth: fallbackAsset.maxDisplayWidth,
    maxDisplayHeight: fallbackAsset.maxDisplayHeight,
  };
}

export const COFFIN_ASSETS = GODS.map(createStageCoffinAsset);

export function getCoffinAsset(coffinSize) {
  return LEGACY_COFFIN_ASSETS[coffinSize] ?? LEGACY_COFFIN_ASSETS.small;
}

export function getCoffinAssetForStage(stage, scene = null, options = {}) {
  const stageNumber = Number(stage) || 1;
  const stageAsset = COFFIN_ASSETS.find((asset) => asset.stage === stageNumber) ?? COFFIN_ASSETS[0];

  if (!stageAsset) {
    return LEGACY_COFFIN_ASSETS.small;
  }

  if (scene?.textures?.exists(stageAsset.assetKey)) {
    return stageAsset;
  }

  maybeWarnAboutFallback(stageAsset, options.debug);
  return {
    ...stageAsset.fallbackAsset,
    stage: stageAsset.stage,
    godId: stageAsset.godId,
    assetKey: stageAsset.fallbackAsset.key,
    fallbackForAssetKey: stageAsset.assetKey,
    fallbackForFileName: stageAsset.fileName,
  };
}

export function getCoffinAssetForGod(god, scene = null, options = {}) {
  return getCoffinAssetForStage(god?.stage, scene, options);
}

export function preloadCoffinAssets(scene) {
  Object.values(LEGACY_COFFIN_ASSETS).forEach((asset) => {
    scene.load.image(asset.key, asset.path);
  });

  scene.load.once('complete', () => {
    loadAvailableStageCoffinAssets(scene);
  });
}

export async function loadAvailableStageCoffinAssets(scene) {
  if (!scene?.load || !scene?.textures) {
    return;
  }

  const availableAssets = [];
  for (const asset of COFFIN_ASSETS) {
    if (scene.textures.exists(asset.assetKey)) {
      continue;
    }

    if (await canLoadStageCoffinAsset(asset)) {
      availableAssets.push(asset);
    } else {
      maybeWarnAboutFallback(asset, scene?.isDebugMode);
    }
  }

  if (availableAssets.length === 0) {
    return;
  }

  scene.load.on('loaderror', (file) => {
    if (!OPTIONAL_STAGE_COFFIN_KEYS.has(file?.key)) {
      return;
    }

    const stageAsset = COFFIN_ASSETS.find((asset) => asset.assetKey === file.key);
    maybeWarnAboutFallback(stageAsset, scene?.isDebugMode);
  });

  availableAssets.forEach((asset) => {
    scene.load.image(asset.assetKey, asset.path);
  });

  scene.load.once('complete', () => {
    scene.events?.emit('coffin-assets-ready');
  });
  scene.load.start();
}

async function canLoadStageCoffinAsset(asset) {
  if (typeof fetch !== 'function') {
    return false;
  }

  try {
    const response = await fetch(asset.path, { method: 'HEAD', cache: 'no-cache' });
    return response.ok;
  } catch (error) {
    return false;
  }
}

function maybeWarnAboutFallback(stageAsset, isDebugMode = false) {
  if (!isDebugMode || !stageAsset || warnedFallbackKeys.has(stageAsset.assetKey)) {
    return;
  }

  warnedFallbackKeys.add(stageAsset.assetKey);
  console.warn(
    `[DUAT] Optional coffin asset ${stageAsset.fileName} for stage ${stageAsset.stage} is not loaded; `
      + `using ${stageAsset.fallbackAsset.fileName} fallback.`,
  );
}

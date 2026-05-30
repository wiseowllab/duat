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

// Keep god coffin art under docs/assets/images/ so the GitHub Pages and
// public-test builds can share the same asset base.
const GOD_COFFIN_DIRECTORY = 'images/coffins/gods';
const OPTIONAL_GOD_COFFIN_KEYS = new Set();
const warnedFallbackKeys = new Set();

export const GOD_COFFIN_FILE_NAMES = [
  'coffin_imsety.png',
  'coffin_hapy.png',
  'coffin_duamutef.png',
  'coffin_qebehsenuef.png',
  'coffin_anubis.png',
  'coffin_thoth.png',
  'coffin_maat.png',
  'coffin_sekhmet.png',
  'coffin_horus.png',
  'coffin_isis.png',
  'coffin_osiris.png',
  'coffin_hathor.png',
  'coffin_ra.png',
  'coffin_amun_ra.png',
];

export const GOD_COFFIN_KEY_BY_GOD_ID = Object.fromEntries(
  GOD_COFFIN_FILE_NAMES.map((fileName) => {
    const key = fileName.replace(/\.png$/, '');
    return [key.replace(/^coffin_/, ''), key];
  }),
);

const GOD_COFFIN_KEY_BY_NORMALIZED_NAME = {
  imsety: 'coffin_imsety',
  hapy: 'coffin_hapy',
  duamutef: 'coffin_duamutef',
  qebehsenuef: 'coffin_qebehsenuef',
  anubis: 'coffin_anubis',
  thoth: 'coffin_thoth',
  maat: 'coffin_maat',
  sekhmet: 'coffin_sekhmet',
  horus: 'coffin_horus',
  isis: 'coffin_isis',
  osiris: 'coffin_osiris',
  hathor: 'coffin_hathor',
  ra: 'coffin_ra',
  amunra: 'coffin_amun_ra',
  amun_ra: 'coffin_amun_ra',
};

function normalizeGodName(name = '') {
  return String(name).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

function getGodCoffinKey(god) {
  if (!god) {
    return GOD_COFFIN_KEY_BY_GOD_ID.imsety;
  }

  return GOD_COFFIN_KEY_BY_GOD_ID[god.id]
    ?? GOD_COFFIN_KEY_BY_NORMALIZED_NAME[normalizeGodName(god.name)]
    ?? null;
}

function createGodCoffinAsset(god, index) {
  const assetKey = getGodCoffinKey(god);
  const fallbackAsset = getCoffinAsset(god.coffinSize);
  const fileName = assetKey ? `${assetKey}.png` : null;

  if (assetKey) {
    OPTIONAL_GOD_COFFIN_KEYS.add(assetKey);
  }

  return {
    stage: index + 1,
    godId: god.id,
    godName: god.name,
    assetKey,
    key: assetKey,
    fileName,
    path: fileName ? resolveAssetPath(`${GOD_COFFIN_DIRECTORY}/${fileName}`) : null,
    fallbackKey: fallbackAsset.key,
    fallbackAsset,
    fallbackWidth: fallbackAsset.fallbackWidth,
    fallbackHeight: fallbackAsset.fallbackHeight,
    maxDisplayWidth: fallbackAsset.maxDisplayWidth,
    maxDisplayHeight: fallbackAsset.maxDisplayHeight,
  };
}

export const COFFIN_ASSETS = GODS.map(createGodCoffinAsset);
export const GOD_COFFIN_ASSETS = COFFIN_ASSETS;

export function getCoffinAsset(coffinSize) {
  return LEGACY_COFFIN_ASSETS[coffinSize] ?? LEGACY_COFFIN_ASSETS.small;
}

export function getCoffinAssetForStage(stage, scene = null, options = {}) {
  const stageNumber = Number(stage) || 1;
  const index = Math.min(Math.max(stageNumber - 1, 0), GODS.length - 1);
  return getCoffinAssetForGod(GODS[index], scene, options);
}

export function getCoffinAssetForGod(god, scene = null, options = {}) {
  const godAsset = COFFIN_ASSETS.find((asset) => asset.godId === god?.id)
    ?? COFFIN_ASSETS.find((asset) => asset.assetKey === getGodCoffinKey(god))
    ?? COFFIN_ASSETS[0];

  if (!godAsset) {
    return LEGACY_COFFIN_ASSETS.small;
  }

  if (godAsset.assetKey && scene?.textures?.exists(godAsset.assetKey)) {
    return godAsset;
  }

  maybeWarnAboutFallback(godAsset, options.debug);
  return {
    ...godAsset.fallbackAsset,
    stage: godAsset.stage,
    godId: godAsset.godId,
    godName: godAsset.godName,
    assetKey: godAsset.fallbackAsset.key,
    fallbackForAssetKey: godAsset.assetKey,
    fallbackForFileName: godAsset.fileName,
  };
}

export function preloadCoffinAssets(scene) {
  Object.values(LEGACY_COFFIN_ASSETS).forEach((asset) => {
    scene.load.image(asset.key, asset.path);
  });

  scene.load.once('complete', () => {
    loadAvailableGodCoffinAssets(scene);
  });
}

export async function loadAvailableGodCoffinAssets(scene) {
  if (!scene?.load || !scene?.textures) {
    return;
  }

  const availableAssets = [];
  for (const asset of GOD_COFFIN_ASSETS) {
    if (!asset.assetKey || !asset.path || scene.textures.exists(asset.assetKey)) {
      continue;
    }

    if (await canLoadGodCoffinAsset(asset)) {
      availableAssets.push(asset);
    } else {
      maybeWarnAboutFallback(asset, scene?.isDebugMode);
    }
  }

  if (availableAssets.length === 0) {
    scene.events?.emit('coffin-assets-ready');
    return;
  }

  scene.load.on('loaderror', (file) => {
    if (!OPTIONAL_GOD_COFFIN_KEYS.has(file?.key)) {
      return;
    }

    const godAsset = GOD_COFFIN_ASSETS.find((asset) => asset.assetKey === file.key);
    maybeWarnAboutFallback(godAsset, scene?.isDebugMode);
  });

  availableAssets.forEach((asset) => {
    scene.load.image(asset.assetKey, asset.path);
  });

  scene.load.once('complete', () => {
    scene.events?.emit('coffin-assets-ready');
  });
  scene.load.start();
}

async function canLoadGodCoffinAsset(asset) {
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

function maybeWarnAboutFallback(godAsset, isDebugMode = false) {
  if (!isDebugMode || !godAsset || warnedFallbackKeys.has(godAsset.assetKey)) {
    return;
  }

  warnedFallbackKeys.add(godAsset.assetKey);
  console.warn(
    `[DUAT] Optional god coffin asset ${godAsset.fileName} for ${godAsset.godName} is not loaded; `
      + `using ${godAsset.fallbackAsset.fileName} fallback.`,
  );
}

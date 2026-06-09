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
const GOD_COFFIN_HIGH_DIRECTORY = 'images/coffin/high';
const GOD_COFFIN_ICON_DIRECTORY = 'images/coffin/icon';
export const COFFIN_ASSET_VARIANTS = Object.freeze({
  HIGH: 'high',
  ICON: 'icon',
});
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
  const highKey = assetKey;
  const iconKey = assetKey ? `${assetKey}_icon_64` : null;
  const highFileName = highKey ? `${highKey}.png` : null;
  const iconFileName = iconKey ? `${iconKey}.png` : null;

  [highKey, iconKey].filter(Boolean).forEach((key) => OPTIONAL_GOD_COFFIN_KEYS.add(key));

  return {
    stage: index + 1,
    godId: god.id,
    godName: god.name,
    assetKey: highKey,
    key: highKey,
    fileName: highFileName,
    path: highFileName ? resolveAssetPath(`${GOD_COFFIN_HIGH_DIRECTORY}/${highFileName}`) : null,
    coffinHighKey: highKey,
    coffinHighFileName: highFileName,
    coffinHighPath: highFileName ? resolveAssetPath(`${GOD_COFFIN_HIGH_DIRECTORY}/${highFileName}`) : null,
    coffinIconKey: iconKey,
    coffinIconFileName: iconFileName,
    coffinIconPath: iconFileName ? resolveAssetPath(`${GOD_COFFIN_ICON_DIRECTORY}/${iconFileName}`) : null,
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

  const variant = options.variant === COFFIN_ASSET_VARIANTS.ICON
    ? COFFIN_ASSET_VARIANTS.ICON
    : COFFIN_ASSET_VARIANTS.HIGH;
  const requestedAsset = getGodCoffinVariantAsset(godAsset, variant);

  if (requestedAsset.key && scene?.textures?.exists(requestedAsset.key)) {
    return requestedAsset;
  }

  if (variant === COFFIN_ASSET_VARIANTS.ICON
    && godAsset.coffinHighKey
    && scene?.textures?.exists(godAsset.coffinHighKey)) {
    maybeWarnAboutFallback(requestedAsset, options.debug, godAsset.coffinHighFileName);
    return {
      ...getGodCoffinVariantAsset(godAsset, COFFIN_ASSET_VARIANTS.HIGH),
      requestedVariant: variant,
      fallbackForAssetKey: requestedAsset.key,
      fallbackForFileName: requestedAsset.fileName,
    };
  }

  maybeWarnAboutFallback(requestedAsset, options.debug, godAsset.fallbackAsset.fileName);
  return {
    ...godAsset.fallbackAsset,
    stage: godAsset.stage,
    godId: godAsset.godId,
    godName: godAsset.godName,
    assetKey: godAsset.fallbackAsset.key,
    variant,
    requestedVariant: variant,
    fallbackForAssetKey: requestedAsset.key,
    fallbackForFileName: requestedAsset.fileName,
  };
}

function getGodCoffinVariantAsset(godAsset, variant) {
  const isIcon = variant === COFFIN_ASSET_VARIANTS.ICON;
  const key = isIcon ? godAsset.coffinIconKey : godAsset.coffinHighKey;
  const fileName = isIcon ? godAsset.coffinIconFileName : godAsset.coffinHighFileName;
  const path = isIcon ? godAsset.coffinIconPath : godAsset.coffinHighPath;

  return {
    ...godAsset,
    assetKey: key,
    key,
    fileName,
    path,
    variant,
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
  for (const godAsset of GOD_COFFIN_ASSETS) {
    for (const variant of Object.values(COFFIN_ASSET_VARIANTS)) {
      const asset = getGodCoffinVariantAsset(godAsset, variant);
      if (!asset.assetKey || !asset.path || scene.textures.exists(asset.assetKey)) {
        continue;
      }

      if (await canLoadGodCoffinAsset(asset)) {
        availableAssets.push(asset);
      } else {
        const fallbackFileName = variant === COFFIN_ASSET_VARIANTS.ICON
          ? godAsset.coffinHighFileName
          : godAsset.fallbackAsset.fileName;
        maybeWarnAboutFallback(asset, scene?.isDebugMode, fallbackFileName);
      }
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

    const godAsset = GOD_COFFIN_ASSETS.find((asset) => [asset.coffinHighKey, asset.coffinIconKey].includes(file.key));
    if (!godAsset) {
      return;
    }

    const failedVariant = godAsset.coffinIconKey === file.key
      ? COFFIN_ASSET_VARIANTS.ICON
      : COFFIN_ASSET_VARIANTS.HIGH;
    const failedAsset = getGodCoffinVariantAsset(godAsset, failedVariant);
    const fallbackFileName = failedVariant === COFFIN_ASSET_VARIANTS.ICON
      ? godAsset.coffinHighFileName
      : godAsset.fallbackAsset.fileName;
    maybeWarnAboutFallback(failedAsset, scene?.isDebugMode, fallbackFileName);
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

function maybeWarnAboutFallback(godAsset, isDebugMode = false, fallbackFileName = null) {
  if (!isDebugMode || !godAsset || warnedFallbackKeys.has(godAsset.assetKey)) {
    return;
  }

  warnedFallbackKeys.add(godAsset.assetKey);
  console.warn(
    `[DUAT] Optional god coffin asset ${godAsset.fileName} for ${godAsset.godName} is not loaded; `
      + `using ${fallbackFileName ?? godAsset.fallbackAsset?.fileName ?? 'placeholder art'} fallback.`,
  );
}

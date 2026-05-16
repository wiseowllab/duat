export const COFFIN_ASSETS = {
  small: {
    key: 'coffin-small',
    path: 'assets/images/coffins/coffin_small.png',
    label: 'T1 Small',
    fallbackWidth: 28,
    fallbackHeight: 36,
    maxDisplayWidth: 50,
    maxDisplayHeight: 50,
  },
  medium: {
    key: 'coffin-medium',
    path: 'assets/images/coffins/coffin_medium.png',
    label: 'T2 Medium',
    fallbackWidth: 34,
    fallbackHeight: 42,
    maxDisplayWidth: 50,
    maxDisplayHeight: 50,
  },
  large: {
    key: 'coffin-large',
    path: 'assets/images/coffins/coffin_large.png',
    label: 'T3 Large',
    fallbackWidth: 40,
    fallbackHeight: 46,
    maxDisplayWidth: 50,
    maxDisplayHeight: 50,
  },
  maximum: {
    key: 'coffin-maximum',
    path: 'assets/images/coffins/coffin_maximum.png',
    label: 'T4 Max',
    fallbackWidth: 44,
    fallbackHeight: 50,
    maxDisplayWidth: 50,
    maxDisplayHeight: 50,
  },
};

export function getCoffinAsset(coffinSize) {
  return COFFIN_ASSETS[coffinSize] ?? COFFIN_ASSETS.small;
}

export function preloadCoffinAssets(scene) {
  Object.values(COFFIN_ASSETS).forEach((asset) => {
    scene.load.image(asset.key, asset.path);
  });
}

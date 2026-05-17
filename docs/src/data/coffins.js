export const COFFIN_ASSETS = {
  small: {
    key: 'coffin-small',
    fileName: 'coffin_small.png',
    path: 'assets/images/coffins/coffin_small.png',
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
    path: 'assets/images/coffins/coffin_medium.png',
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
    path: 'assets/images/coffins/coffin_large.png',
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
    path: 'assets/images/coffins/coffin_maximum.png',
    tierName: 'Maximum Coffin',
    label: 'T4 Max',
    fallbackWidth: 100,
    fallbackHeight: 140,
    maxDisplayWidth: 158,
    maxDisplayHeight: 142,
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

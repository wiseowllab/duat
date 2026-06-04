import { resolveAssetPath } from './assetPaths.js';

export const RESULT_REVIVED_SOUL_ASSET = {
  key: 'result-revived-soul',
  fileName: 'revived_soul.png',
  path: resolveAssetPath('images/result/souls/revived_soul.png'),
};

export const RESULT_GOLDEN_REVIVED_SOUL_ASSET = {
  key: 'result-golden-revived-soul',
  fileName: 'golden_revived_soul.png',
  path: resolveAssetPath('images/result/souls/golden_revived_soul.png'),
};

export const RESULT_SPHINX_GUARDIAN_ASSET = {
  key: 'result-sphinx-guardian',
  fileName: 'sphinx_guardian.png',
  path: resolveAssetPath('images/result/guardians/sphinx_guardian.png'),
};

export function preloadResultCharacterAssets(scene) {
  [
    RESULT_REVIVED_SOUL_ASSET,
    RESULT_GOLDEN_REVIVED_SOUL_ASSET,
    RESULT_SPHINX_GUARDIAN_ASSET,
  ].forEach((asset) => {
    scene.load.image(asset.key, asset.path);
  });
}

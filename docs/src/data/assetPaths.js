export const DEFAULT_ASSET_BASE_PATH = 'assets';

function normalizeAssetBasePath(basePath) {
  if (typeof basePath !== 'string') {
    return DEFAULT_ASSET_BASE_PATH;
  }

  const trimmedPath = basePath.trim();
  if (trimmedPath === '') {
    return '';
  }

  return trimmedPath.replace(/\/+$/, '');
}

function normalizeRelativeAssetPath(relativePath) {
  return String(relativePath).replace(/^\/+/, '');
}

export function getAssetBasePath() {
  return normalizeAssetBasePath(globalThis.window?.DUAT_ASSET_BASE_PATH);
}

export function resolveAssetPath(relativePath) {
  const normalizedPath = normalizeRelativeAssetPath(relativePath);
  const basePath = getAssetBasePath();

  if (basePath === '') {
    return normalizedPath;
  }

  return `${basePath}/${normalizedPath}`;
}

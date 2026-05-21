import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const DEFAULT_GAME_VERSION = '0.1.0-dev';

function getGameVersion() {
  const packageJsonPath = path.join(repoRoot, 'package.json');

  try {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    if (typeof packageJson.version === 'string' && packageJson.version.trim()) {
      return packageJson.version.trim();
    }
  } catch {
    // Fall back to the default when package.json has no version or is unavailable.
  }

  return DEFAULT_GAME_VERSION;
}

function pad(value) {
  return String(value).padStart(2, '0');
}

function buildTimestamp(date = new Date()) {
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  return `${year}-${month}-${day}-${hours}${minutes}${seconds}`;
}

function getCommitSha() {
  try {
    return execSync('git rev-parse --short HEAD', {
      cwd: repoRoot,
      stdio: ['ignore', 'pipe', 'ignore'],
      encoding: 'utf8'
    }).trim();
  } catch {
    return 'local';
  }
}

const outputPath = path.join(repoRoot, 'docs/src/data/buildInfo.js');
const gameVersion = getGameVersion();
const label = buildTimestamp();
const sha = getCommitSha();

const output = `export const GAME_VERSION = '${gameVersion}';\nexport const BUILD_LABEL = '${label}';\nexport const COMMIT_SHA = '${sha}';\n`;

writeFileSync(outputPath, output, 'utf8');
console.log(`Generated ${path.relative(repoRoot, outputPath)} (${label}, ${sha})`);

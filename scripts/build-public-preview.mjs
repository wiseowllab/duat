import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), '..');
const docsRoot = path.join(repoRoot, 'docs');
const publicTestRoot = path.join(docsRoot, 'public-test');
const publicTestSrcRoot = path.join(publicTestRoot, 'src');

const sourceIndexPath = path.join(docsRoot, 'index.html');
const publicTestIndexPath = path.join(publicTestRoot, 'index.html');
const publicTestMainPath = path.join(publicTestSrcRoot, 'main.js');

const assetConfigScript = `    <script>\n      window.DUAT_ASSET_BASE_PATH = '../assets';\n    </script>\n`;
const scriptMarker = '    <script src="https://cdn.jsdelivr.net/npm/phaser@3.90.0/dist/phaser.min.js"></script>\n';

function ensureDirectory(directoryPath) {
  fs.mkdirSync(directoryPath, { recursive: true });
}

function removeDuplicateAssetCopies() {
  for (const assetFolder of ['assets', 'images', 'audio']) {
    fs.rmSync(path.join(publicTestRoot, assetFolder), { recursive: true, force: true });
  }
}

function buildPublicTestIndex() {
  const sourceHtml = fs.readFileSync(sourceIndexPath, 'utf8');
  const publicTestHtml = sourceHtml
    .replace('<title>DUAT — 古代エジプト落ち物パズル</title>', '<title>DUAT Public Test — 古代エジプト落ち物パズル</title>')
    .replace(scriptMarker, `${assetConfigScript}${scriptMarker}`);

  fs.writeFileSync(publicTestIndexPath, publicTestHtml);
}

function buildPublicTestEntrypoint() {
  const publicTestMain = `// Lightweight public-test entrypoint: run the shared game source without copying assets.\nimport '../../src/main.js';\n`;
  fs.writeFileSync(publicTestMainPath, publicTestMain);
}

ensureDirectory(publicTestRoot);
ensureDirectory(publicTestSrcRoot);
removeDuplicateAssetCopies();
buildPublicTestIndex();
buildPublicTestEntrypoint();

console.log('Built lightweight docs/public-test without duplicated binary assets.');

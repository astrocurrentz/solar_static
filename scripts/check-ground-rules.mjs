import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SPA_ROUTE_PATHS } from '../shared/routes.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const generatedMarkers = [
  'GENERATED FILE: edit shared/copy',
  'GENERATED FILE: edit shared/design',
];
const authoredExtensions = new Set(['.ts', '.tsx', '.js', '.mjs', '.cjs', '.css', '.html', '.json', '.toml']);
const assetExtensions = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.otf', '.woff', '.woff2', '.md', '.sql']);
const maxAuthoredLines = 600;
const rawColorPattern = /#[0-9a-fA-F]{3,8}|rgba?\([^)]*\)/;
const rawFontPattern = /font-family:\s*['"]|fontFamily:\s*['"]|font:\s*['"][^'"]*(Syne|Space Mono|Noto Sans SC|Menlo|monospace)/;
const approvedLiteralFiles = new Set([
  'shared/design/tokens.mjs',
  'shared/design/generated-token-vars.css',
]);
const generatedRequiredFiles = [
  'index.html',
  'public/404.html',
  'public/external/font.css',
  'public/external/bazi/styles.css',
  'public/external/bazi/reference-ui.js',
  'public/external/index.html',
  'public/external/bazi/index.html',
  'public/external/bazi/privacy/index.html',
  'public/external/bazi/reference/SMTH/index.html',
  'public/external/bazi/reference/YHZP/index.html',
  'public/external/bazi/reference/ZPZQ/index.html',
  'public/external/bazi/reference/WXJJ/index.html',
  'public/privacy/index.html',
  'public/privacy/bazi/index.html',
  'public/exteral/bazi/index.html',
  'public/exteral/bazi/privacy/index.html',
  'public/exteral/exteral/bazi/index.html',
  'public/exteral/exteral/bazi/privacy/index.html',
];

const errors = [];

const toRepoPath = (absolutePath) => path.relative(rootDir, absolutePath).split(path.sep).join('/');

const walk = async (dir) => {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = path.join(dir, entry.name);
    const repoPath = toRepoPath(absolutePath);

    if (
      entry.name === 'node_modules' ||
      entry.name === 'dist' ||
      entry.name === '.git' ||
      repoPath.startsWith('.vercel/')
    ) {
      continue;
    }

    if (entry.isDirectory()) {
      files.push(...await walk(absolutePath));
      continue;
    }

    files.push(absolutePath);
  }

  return files;
};

const hasGeneratedMarker = (content) => generatedMarkers.some((marker) => content.includes(marker));

const stripFontFaceBlocks = (content) => content.replace(/@font-face\s*\{[\s\S]*?\}/g, '');

for (const repoPath of generatedRequiredFiles) {
  const content = await fs.readFile(path.join(rootDir, repoPath), 'utf8').catch(() => '');
  if (!hasGeneratedMarker(content)) {
    errors.push(`${repoPath} is generated but is missing a generated-file marker.`);
  }
}

const files = await walk(rootDir);

for (const absolutePath of files) {
  const repoPath = toRepoPath(absolutePath);
  const extension = path.extname(repoPath);

  if (assetExtensions.has(extension) || !authoredExtensions.has(extension)) {
    continue;
  }

  const content = await fs.readFile(absolutePath, 'utf8');
  const generated = hasGeneratedMarker(content);
  const approvedLiteralFile = approvedLiteralFiles.has(repoPath);

  if (!generated && extension !== '.json' && extension !== '.toml') {
    const lineCount = content.split('\n').length;
    if (lineCount > maxAuthoredLines) {
      errors.push(`${repoPath} has ${lineCount} lines; split or generate it before exceeding ${maxAuthoredLines}.`);
    }
  }

  if (generated || approvedLiteralFile) {
    continue;
  }

  if (rawColorPattern.test(content)) {
    errors.push(`${repoPath} contains raw color literals; use shared/design/tokens.mjs or generated CSS variables.`);
  }

  if (rawFontPattern.test(stripFontFaceBlocks(content))) {
    errors.push(`${repoPath} contains raw font literals; use shared/design/tokens.mjs.`);
  }
}

const vercelConfig = JSON.parse(await fs.readFile(path.join(rootDir, 'vercel.json'), 'utf8'));
const vercelRewriteSources = (vercelConfig.rewrites ?? []).map((rewrite) => rewrite.source).sort();
const expectedSpaSources = SPA_ROUTE_PATHS.filter((route) => route !== '/').sort();
if (JSON.stringify(vercelRewriteSources) !== JSON.stringify(expectedSpaSources)) {
  errors.push('vercel.json rewrites do not match shared/routes.mjs SPA_ROUTE_PATHS.');
}

const netlifyConfig = await fs.readFile(path.join(rootDir, 'netlify.toml'), 'utf8');
for (const route of expectedSpaSources) {
  if (!netlifyConfig.includes(`from = "${route}"`) || !netlifyConfig.includes('to = "/index.html"')) {
    errors.push(`netlify.toml is missing SPA redirect for ${route}.`);
  }
}

const toolsPage = await fs.readFile(path.join(rootDir, 'components/tools/textToImageConfig.ts'), 'utf8');
const renderer = await fs.readFile(path.join(rootDir, 'server/text-to-img-post-renderer.mjs'), 'utf8');
if (!toolsPage.includes('TEXT_TO_IMG_POST_CONFIG') || !renderer.includes('TEXT_TO_IMG_POST_CONFIG')) {
  errors.push('Text-to-image frontend and renderer must both import TEXT_TO_IMG_POST_CONFIG.');
}

if (errors.length > 0) {
  console.error(errors.map((error) => `- ${error}`).join('\n'));
  process.exit(1);
}

console.log('Ground rules check passed.');

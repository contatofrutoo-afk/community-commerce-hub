import { readFileSync, writeFileSync, existsSync } from 'fs';

const swPath = new URL('../public/sw.js', import.meta.url);
if (!existsSync(swPath)) {
  console.log('[bump-cache] sw.js not found, skipping');
  process.exit(0);
}

let content = readFileSync(swPath, 'utf-8');
const match = content.match(/const CACHE_NAME = 'weaze-v(\d+)'/);
if (!match) {
  console.log('[bump-cache] Could not find cache version, skipping');
  process.exit(0);
}

const currentVersion = parseInt(match[1], 10);
const newVersion = currentVersion + 1;
const newContent = content.replace(
  /const CACHE_NAME = 'weaze-v\d+'/,
  `const CACHE_NAME = 'weaze-v${newVersion}'`
);

writeFileSync(swPath, newContent, 'utf-8');
console.log(`[bump-cache] weaze-v${currentVersion} → weaze-v${newVersion}`);
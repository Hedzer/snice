#!/usr/bin/env node

/**
 * Updates llms.txt and llms-full.txt with current version and component count.
 * Run automatically during release via semantic-release exec plugin.
 *
 * Usage: node scripts/update-llms.js [version]
 * If version is omitted, reads from package.json.
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Get version
const version = process.argv[2] || JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version;
const versionMajorMinor = version.replace(/\.\d+$/, '.x');

// Count published components (total dirs minus .wip entries)
const componentsDir = join(root, 'components');
const wipFile = join(componentsDir, '.wip');
const wipEntries = new Set(
  readFileSync(wipFile, 'utf8')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#'))
);

const allComponents = readdirSync(componentsDir).filter(name => {
  if (name.startsWith('.')) return false;
  const fullPath = join(componentsDir, name);
  return statSync(fullPath).isDirectory();
});

const publishedCount = allComponents.filter(name => !wipEntries.has(name)).length;

// Round down to nearest 10 with "+" suffix (e.g. 133 → "130+")
const roundedCount = `${Math.floor(publishedCount / 10) * 10}+`;

// Update both files
for (const filename of ['llms.txt', 'llms-full.txt']) {
  const filepath = join(root, filename);
  let content = readFileSync(filepath, 'utf8');

  // Update version (matches "4.26.x" or "4.26.2" patterns after "Version: ")
  content = content.replace(
    /Version: [\d]+\.[\d]+\.[\dx]+/g,
    `Version: ${versionMajorMinor}`
  );

  // Update component count (matches "130+" or "133" before " UI components" or " published)")
  content = content.replace(
    /\d+\+? UI components/g,
    `${roundedCount} UI components`
  );
  content = content.replace(
    /Components \(\d+\+? published\)/g,
    `Components (${roundedCount} published)`
  );

  writeFileSync(filepath, content);
  console.log(`Updated ${filename}: v${versionMajorMinor}, ${roundedCount} components (actual: ${publishedCount})`);
}

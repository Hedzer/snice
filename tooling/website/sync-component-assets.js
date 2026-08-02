#!/usr/bin/env node
// Rebuilds the generated website component-asset directory from authoritative
// package and CDN outputs. Cleaning first is intentional: removed or renamed
// components must not survive into a deployment as stale bundles.

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const publicDir = process.env.SNICE_WEBSITE_PUBLIC_DIR || join(root, 'website', 'public');
const componentsDir = join(publicDir, 'components');
const cdnDir = join(root, 'dist', 'cdn');

rmSync(componentsDir, { recursive: true, force: true });
mkdirSync(componentsDir, { recursive: true });

let bundles = 0;
const copiedBundles = new Map();
if (existsSync(cdnDir)) {
  for (const entry of readdirSync(cdnDir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (!entry.isDirectory()) continue;
    const sourceDir = join(cdnDir, entry.name);
    for (const file of readdirSync(sourceDir).sort()) {
      if (!/^snice-.*\.min\.js$/.test(file)) continue;
      const previous = copiedBundles.get(file);
      if (previous) {
        throw new Error(`CDN bundles collide at ${file}: ${previous} and ${sourceDir}`);
      }
      cpSync(join(sourceDir, file), join(componentsDir, file));
      copiedBundles.set(file, sourceDir);
      bundles++;
    }
  }
} else {
  console.warn('CDN output is absent; run `npm run build:cdn` to populate website component bundles.');
}

const supportAssets = [
  {
    source: join(root, 'packages', 'components', 'src', 'pdf-viewer', 'pdf.worker.min.mjs'),
    target: join(componentsDir, 'pdf.worker.min.mjs'),
  },
  {
    source: join(root, 'packages', 'components', 'src', 'code-block', 'grammars', 'snice.json'),
    target: join(componentsDir, 'grammars', 'snice.json'),
  },
];

for (const { source, target } of supportAssets) {
  if (!existsSync(source)) throw new Error(`Required website component asset is missing: ${source}`);
  mkdirSync(dirname(target), { recursive: true });
  cpSync(source, target);
}

console.log(`Synced ${bundles} CDN bundle(s) and ${supportAssets.length} support asset(s).`);

#!/usr/bin/env node
// Stamps all local asset references in public/*.html with ?v=[git-hash] for cache busting.
// Run: node scripts/stamp-assets.js        (stamp)
//      node scripts/stamp-assets.js --clean (remove stamps)
import { execSync } from 'child_process';
import { createHash } from 'crypto';
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const publicDir = join(root, 'public');
const clean = process.argv.includes('--clean');

// Use content hash of all public assets so rebuilds always bust the cache
function computeContentHash() {
  const h = createHash('md5');
  const dirs = [publicDir, join(publicDir, 'components'), join(publicDir, 'grammars')];
  for (const dir of dirs) {
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir).sort()) {
      const fp = join(dir, f);
      if (statSync(fp).isFile() && /\.(js|css|json|woff2?)$/i.test(f)) {
        h.update(readFileSync(fp));
      }
    }
  }
  return h.digest('hex').slice(0, 7);
}

const hash = clean ? null : computeContentHash();

// Asset extensions to cache-bust
const ASSET_EXT = /\.(?:css|js|png|jpe?g|gif|svg|ico|webp|json|woff2?)$/i;

function stampHtml(content) {
  if (clean) {
    // Remove all ?v=... from local asset URLs
    content = content.replace(
      /((?:href|src)=["'])([^"'?#]+)\?v=[a-f0-9]+(["'])/gi,
      '$1$2$3'
    );
    // Remove from grammar JS strings
    content = content.replace(
      /(grammars\/[\w.-]+\.json)\?v=[a-f0-9]+/g,
      '$1'
    );
    return content;
  }

  // Stamp href="..." and src="..." for local assets (skip external, data:, anchors)
  content = content.replace(
    /((?:href|src)=["'])((?!https?:\/\/|\/\/|data:|#|mailto:)[^"'?#]+?)(\?v=[a-f0-9]+)?(["'])/gi,
    (match, prefix, url, oldVersion, quote) => {
      if (ASSET_EXT.test(url)) {
        return `${prefix}${url}?v=${hash}${quote}`;
      }
      return match;
    }
  );

  // Stamp grammar references in JS strings: 'grammars/foo.json' or "grammars/foo.json"
  content = content.replace(
    /(grammars\/[\w.-]+\.json)(\?v=[a-f0-9]+)?/g,
    `$1?v=${hash}`
  );

  return content;
}

function processDir(dir) {
  let count = 0;
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.git') continue;
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      // Only recurse into showcases (for fragments), skip others
      if (entry === 'showcases') count += processDir(fullPath);
      continue;
    }
    if (!entry.endsWith('.html')) continue;
    const content = readFileSync(fullPath, 'utf-8');
    const stamped = stampHtml(content);
    if (content !== stamped) {
      writeFileSync(fullPath, stamped);
      count++;
    }
  }
  return count;
}

const count = processDir(publicDir);
if (clean) {
  console.log(`Cleaned ${count} files`);
} else {
  console.log(`Stamped ${count} files with ?v=${hash}`);
}

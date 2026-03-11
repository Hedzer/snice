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
const dirFlagIdx = process.argv.indexOf('--dir');
const targetDir = dirFlagIdx !== -1 ? process.argv[dirFlagIdx + 1] : publicDir;

// Use content hash of all public assets so rebuilds always bust the cache
function computeContentHash() {
  const h = createHash('md5');
  const dirs = [targetDir, join(targetDir, 'components'), join(targetDir, 'grammars')];
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
const version = clean ? null : JSON.parse(readFileSync(join(root, 'package.json'), 'utf-8')).version;

// Asset extensions to cache-bust
const ASSET_EXT = /\.(?:css|js|png|jpe?g|gif|svg|ico|webp|json|woff2?)$/i;

function stampHtml(content) {
  // Match local asset paths: dir/file.ext or dir/file.ext?v=old
  // Captures: $1=prefix char, $2=path, $3=optional old stamp
  const ASSET_PATH = /(["'(=\s,])((?!https?:\/\/|\/\/|data:)(?:[\w./-]+\/)?[\w.-]+\.(?:css|json|png|jpe?g|gif|svg|ico|webp|woff2?|md|js))(\?v=[a-f0-9.]+)?/gi;

  // Clean old .html stamps if present
  const HTML_PATH = /(href=["'])((?!https?:\/\/|\/\/|#|mailto:)[\w./-]+\.html)(\?v=[^"']+)?(["'])/gi;

  if (clean) {
    content = content.replace(ASSET_PATH, '$1$2');
    content = content.replace(HTML_PATH, '$1$2$4');
    return content;
  }

  content = content.replace(ASSET_PATH, (match, before, url, oldVersion) => {
    return `${before}${url}?v=${hash}`;
  });

  // Strip any leftover ?v= from HTML hrefs (HTML revalidates via 304, not stamps)
  content = content.replace(HTML_PATH, (match, prefix, url, oldVersion, quote) => {
    return `${prefix}${url}${quote}`;
  });

  // Replace version placeholder for dynamic fetches
  content = content.replace(/__SNICE_VERSION__/g, version);

  return content;
}

function processDir(dir) {
  let count = 0;
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.git') continue;
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      count += processDir(fullPath);
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

const count = processDir(targetDir);
if (clean) {
  console.log(`Cleaned ${count} files`);
} else {
  console.log(`Stamped ${count} files with ?v=${hash}`);
}

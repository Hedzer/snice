#!/usr/bin/env node
// Stamps all local asset references in website/public/*.html with ?v=[git-hash]
// for cache busting.
import { execSync } from 'child_process';
import { createHash } from 'crypto';
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, dirname, isAbsolute, relative, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..', '..');
const publicDir = join(root, 'website', 'public');
const clean = process.argv.includes('--clean');
const dirFlagIdx = process.argv.indexOf('--dir');
const targetDir = dirFlagIdx !== -1 ? process.argv[dirFlagIdx + 1] : publicDir;

// Asset extensions to cache-bust and include in the release content hash.
const ASSET_EXT = /\.(?:css|js|png|jpe?g|gif|svg|ico|webp|json|md|woff2?)$/i;

// Use content hash of all public assets so rebuilds always bust the cache
export function computeContentHash(baseDir = targetDir) {
  const h = createHash('md5');
  const files = [];

  function collect(dir) {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir).sort()) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) collect(fullPath);
      else if (ASSET_EXT.test(entry)) files.push(fullPath);
    }
  }

  collect(baseDir);
  for (const file of files.sort()) {
    // Include the path as well as the bytes so renaming an asset also changes
    // the release key, even when its contents are unchanged.
    h.update(relative(baseDir, file));
    h.update('\0');
    h.update(readFileSync(file));
  }
  return h.digest('hex').slice(0, 7);
}

const hash = clean ? null : computeContentHash();
const version = clean ? null : JSON.parse(readFileSync(join(root, 'package.json'), 'utf-8')).version;

function pointsToExistingAsset(url, baseDir) {
  const path = url.split(/[?#]/, 1)[0];
  const resolved = path.startsWith('/')
    ? resolve(targetDir, `.${path}`)
    : resolve(baseDir, path);
  const insideTarget = relative(targetDir, resolved);
  if (insideTarget.startsWith('..') || isAbsolute(insideTarget)) return false;
  return existsSync(resolved) && statSync(resolved).isFile();
}

export function stampHtml(content, baseDir = targetDir) {
  // Code blocks are copy/paste source, not live URL contexts. Protect their
  // bodies while still allowing URL attributes on the <snice-code-block>
  // element itself (notably grammar="...") to be stamped.
  const codeBlockBodies = [];
  content = content.replace(
    /(<snice-code-block\b[^>]*>)([\s\S]*?)(<\/snice-code-block>)/gi,
    (_match, open, body, close) => {
      const index = codeBlockBodies.push(body) - 1;
      return `${open}__SNICE_CODE_BLOCK_BODY_${index}__${close}`;
    }
  );
  const restoreCodeBlocks = (html) => html.replace(
    /__SNICE_CODE_BLOCK_BODY_(\d+)__/g,
    (_match, index) => codeBlockBodies[Number(index)]
  );

  const TAG = /<\/?[A-Za-z][^>]*>/g;
  const ATTRIBUTE_ASSET = /(\b([\w:-]+)\s*=\s*["'])((?!https?:\/\/|\/\/|data:)(?:[\w./-]+\/)?[\w.-]+\.(?:css|json|png|jpe?g|gif|svg|ico|webp|woff2?|md|js))(\?v=[a-f0-9.]+)?(["'])/gi;
  const CSS_ASSET = /(url\(\s*["']?)((?!https?:\/\/|\/\/|data:)(?:[\w./-]+\/)?[\w.-]+\.(?:css|json|png|jpe?g|gif|svg|ico|webp|woff2?|md|js))(\?v=[a-f0-9.]+)?(["']?\s*\))/gi;
  const QUOTED_ASSET = /(["'`])((?!https?:\/\/|\/\/|data:)(?:[\w./-]+\/)?[\w.-]+\.(?:css|json|png|jpe?g|gif|svg|ico|webp|woff2?|md|js))(\?v=[a-f0-9.]+)?\1/gi;

  // Clean old .html stamps if present
  const HTML_PATH = /(href=["'])((?!https?:\/\/|\/\/|#|mailto:)[\w./-]+\.html)(\?v=[^"']+)?(["'])/gi;

  if (clean) {
    content = content.replace(TAG, (tag) => tag.replace(
      ATTRIBUTE_ASSET,
      (_match, prefix, _attribute, url, _oldVersion, quote) => `${prefix}${url}${quote}`
    ));
    content = content.replace(CSS_ASSET, '$1$2$4');
    content = content.replace(QUOTED_ASSET, '$1$2$1');
    content = content.replace(HTML_PATH, '$1$2$4');
    return restoreCodeBlocks(content);
  }

  // HTML attributes and CSS url() values are URL-bearing contexts, so stamp
  // them even for intentional broken/fallback examples or generated partials.
  content = content.replace(TAG, (tag) => tag.replace(
    ATTRIBUTE_ASSET,
    (_match, prefix, attribute, url, _oldVersion, quote) => {
      // `download` is a suggested filename, not a resource URL. Appending a
      // cache key changes the file customers receive (for example,
      // report.pdf?v=abc becomes report.pdf_v=abc in Chromium/WebKit).
      if (attribute.toLowerCase() === 'download') return `${prefix}${url}${quote}`;
      return `${prefix}${url}?v=${hash}${quote}`;
    }
  ));
  content = content.replace(
    CSS_ASSET,
    (_match, prefix, url, _oldVersion, suffix) => `${prefix}${url}?v=${hash}${suffix}`
  );

  // JavaScript data often contains image/grammar paths. Only stamp a quoted
  // string when it resolves to a real deploy file; this excludes displayed
  // sample output and method/property names such as response.json().
  content = content.replace(QUOTED_ASSET, (match, quote, url) => {
    if (!pointsToExistingAsset(url, baseDir)) return match;
    return `${quote}${url}?v=${hash}${quote}`;
  });

  // Strip any leftover ?v= from HTML hrefs (HTML revalidates via 304, not stamps)
  content = content.replace(HTML_PATH, (match, prefix, url, oldVersion, quote) => {
    return `${prefix}${url}${quote}`;
  });

  // Replace version placeholder for dynamic fetches
  content = content.replace(/__SNICE_VERSION__/g, version);

  return restoreCodeBlocks(content);
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
    const stamped = stampHtml(content, dirname(fullPath));
    if (content !== stamped) {
      writeFileSync(fullPath, stamped);
      count++;
    }
  }
  return count;
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  const count = processDir(targetDir);
  if (clean) {
    console.log(`Cleaned ${count} files`);
  } else {
    console.log(`Stamped ${count} files with ?v=${hash}`);
  }
}

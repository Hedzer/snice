#!/usr/bin/env node
/**
 * Generates dedicated visual fixtures for the tests/live/components specs
 * that still measure generated showcase pages.
 *
 * The specs were written against website/showcases/<name>/full.html served
 * through the dev server's legacy route. The page is a fine basis for a
 * fixture, but it must stop being the page under test: it carries the
 * website's theme-preset script (localStorage state), remote assets
 * (picsum, pravatar, dicebear, soundhelix, gtv-videos), and is regenerated
 * by the website build. A fixture is the same content, stripped and
 * deterministic:
 *
 *   - the theme-preset script and every `data-theme` attribute go away
 *     (the theme.css defaults are the deterministic surface);
 *   - component imports are rewritten to the repo-root path;
 *   - remote images (picsum/pravatar/dicebear/flagcdn) become local SVG
 *     data URLs with deterministic colours;
 *   - remote audio (soundhelix) becomes '' (durations are supplied via
 *     data where a spec needs them) and remote video (gtv-videos) points
 *     at the existing local fixture clip;
 *   - a `document.documentElement.dataset.fixtureReady` flag and the
 *     fonts-ready await are appended to the module script;
 *   - the page keeps its section structure and styles, so the specs'
 *     selectors keep meaning.
 *
 * Special cases are NOT automated: camera/audio permission specs, the
 * spreadsheet alpha, and anything where a spec asserts on content the
 * generator cannot know about — those need a human pass.
 *
 * Usage: node tooling/testing/generate-visual-fixtures.js [component ...]
 *   (no args: every showcase that has a spec in tests/live/components)
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const REPO = process.cwd();
const SHOWCASES = join(REPO, 'website/showcases');
const FIXTURES = join(REPO, 'tests/live/fixtures');
const SPECS = join(REPO, 'tests/live/components');

function sha1(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

const PALETTE = [
  '#2563eb', '#16a34a', '#ea580c', '#7c3aed', '#dc2626', '#0d9488',
  '#ca8a04', '#db2777', '#4f46e5', '#059669',
];

/** A deterministic local SVG image for a remote photo/avatar URL. */
function localImage(url) {
  const seed = url.match(/seed\/([^/]+)/)?.[1]
    ?? url.match(/(?:u|user)=([^&/]+)/)?.[1]
    ?? url.match(/\/(\w+)\/(\d+)\/(\d+)/)?.[1]
    ?? 'seed';
  const size = url.match(/\/(\d+)(?:\/(\d+))?(?:\?|$)/);
  const w = size?.[1] ? Number(size[1]) : 120;
  const h = size?.[2] ? Number(size[2]) : w;
  const color = PALETTE[sha1(seed) % PALETTE.length];
  const cx = Math.round(w / 2);
  const cy = Math.round(h / 2);
  const r = Math.max(6, Math.round(Math.min(w, h) / 3));
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">`
    + `<rect width="${w}" height="${h}" fill="${color}"/>`
    + `<circle cx="${cx}" cy="${cy}" r="${r}" fill="rgba(255,255,255,0.3)"/>`
    + `</svg>`)}`;
}

function localizeUrl(url) {
  if (/picsum\.photos|pravatar\.cc|dicebear\.com|flagcdn\.com|ui-avatars\.com|flaticon\.com/.test(url)) {
    return localImage(url);
  }
  if (/soundhelix\.com/.test(url)) return '';
  if (/gtv-videos-bucket|commondatastorage\.googleapis\.com/.test(url)) {
    return '/tests/live/fixtures/video-player/fixture-clip.webm';
  }
  return url;
}

function componentFromSpec(file) {
  const m = file.match(/\/([^/]+)\/[^/]+\.spec\.ts$/);
  return m?.[1] ?? null;
}

function main() {
  const args = process.argv.slice(2);
  const specFiles = [];
  const walk = (dir) => {
    let entries;
    try { entries = readdirSync(dir); } catch { return; }
    for (const entry of entries) {
      const full = join(dir, entry);
      let stat;
      try { stat = statSync(full); } catch { continue; }
      if (stat.isDirectory()) walk(full);
      else if (/\.spec\.ts$/.test(entry)) specFiles.push(full);
    }
  };
  walk(SPECS);

  const wanted = new Set(args);
  const components = [...new Set(specFiles.map(componentFromSpec).filter(Boolean))]
    .filter((c) => wanted.size === 0 || wanted.has(c))
    .sort();

  let made = 0;
  let skipped = 0;
  for (const component of components) {
    const showcase = join(SHOWCASES, component, 'full.html');
    if (!existsSync(showcase)) {
      console.log(`skip ${component}: no showcase`);
      skipped++;
      continue;
    }
    const outDir = join(FIXTURES, component);
    const outFile = join(outDir, 'visual.html');
    if (existsSync(outFile)) {
      console.log(`skip ${component}: fixture exists`);
      skipped++;
      continue;
    }

    let html = readFileSync(showcase, 'utf8');

    // Strip the website's theme-preset script (localStorage state).
    html = html.replace(
      /<script>\s*document\.documentElement\.setAttribute\('data-theme'.*?<\/script>/s,
      '',
    );
    html = html.replace(/\s*data-theme="[^"]*"/g, '');

    // Strip remote webfont links: a font arriving mid-measurement reflows
    // text-dependent boxes and is a classic flake vector; the theme's own
    // font stack is the deterministic surface.
    html = html.replace(
      /<link[^>]*href="https:\/\/fonts\.(googleapis|gstatic)\.com[^>]*>/g,
      '',
    );

    // Rewrite component imports to repo-root paths. BOTH the default-import
    // and named-import forms (and src= attributes) must be rewritten:
    // relative ../../../ paths resolve fine from a real file but not from
    // vite's html-proxy module.
    html = html.replace(
      /(['"])\.\.\/\.\.\/\.\.\/packages\/components\/src\//g,
      (_, q) => `${q}/packages/components/src/`,
    );

    // Localize remote assets in attributes.
    html = html.replace(/src="(https:\/\/[^"]+)"/g, (_, url) => `src="${localizeUrl(url)}"`);
    html = html.replace(/href="(https:\/\/[^"]+)"/g, (_, url) => `href="${localizeUrl(url)}"`);
    // URLs built in JS (template literals / string concat).
    html = html.replace(
      /(['"`])(https:\/\/[^'"`]+)\1/g,
      (m, q, url) => `${q}${localizeUrl(url)}${q}`,
    );

    // Fixture marker: readiness + fonts settled.
    html = html.replace(
      /<\/body>/,
      `    <script type="module">
      if (document.fonts?.ready) await document.fonts.ready;
      document.documentElement.dataset.fixtureReady = 'true';
    </script>
  </body>`,
    );
    // If the page has no module script (all inline HTML), the marker script
    // still runs — but the top-level await requires a module script; the
    // replace above emits one, so keep it as-is.

    mkdirSync(outDir, { recursive: true });
    writeFileSync(outFile, html);
    made++;
    console.log(`made ${component}: ${outFile}`);
  }
  console.log(`\n${made} fixture(s) written, ${skipped} skipped.`);
}

main();

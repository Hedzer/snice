# Deploy Artifact, Full Showcase Panel & Docs Fixes — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Stop committing stamped files by building a deploy artifact in `dist/site/`. Add a unified "More" side panel with Docs + Full Showcase tabs. Fix the mdToHtml parser.

**Architecture:** The deploy pipeline copies `public/` into `dist/site/`, transforms full-showcase files from .ts imports to CDN scripts, stamps all assets, and deploys from there. The components page gets a tabbed side panel that loads docs (markdown) or full showcases (iframe). Source files are never stamped.

**Tech Stack:** Node.js scripts, Vite, Cloudflare Wrangler, vanilla JS/CSS for the panel

---

## Task 1: Strip stamps from source (one-time cleanup)

**Files:**
- Modify: all `public/**/*.html` files (automated via existing script)

**Step 1: Run the existing unstamp script**

```bash
node scripts/stamp-assets.js --clean
```

Expected: all `?v=...` removed from every HTML file in `public/`

**Step 2: Verify stamps are gone**

```bash
grep -r '?v=' public/ --include='*.html' | head -5
```

Expected: no output (zero matches)

**Step 3: Commit**

```bash
git add public/
git commit -m "chore: strip asset stamps from source files

Stamps will only exist in the deploy artifact (dist/site/) going forward."
```

---

## Task 2: Fix mdToHtml parser in _footer.html

**Files:**
- Modify: `public/showcases/_footer.html:184-246` (mdToHtml function)

**Step 1: Fix the mdToHtml function**

Replace the entire `mdToHtml` function (lines 184-246) with a fixed version that:

1. Strips `[//]: #` markdown comment lines (ignore them entirely)
2. Strips `<!-- ... -->` HTML comment lines
3. Fixes table parsing: first row = `<th>`, separator row skipped, remaining rows = `<td>`
4. Adds numbered list support (`1. `, `2. `, etc.) → `<ol>`
5. Removes hardcoded `?v=ff60e40` from grammar paths in code blocks — use bare paths, the deploy stamper will add stamps

```javascript
    function mdToHtml(md) {
      let html = '';
      const lines = md.split('\n');
      let inCode = false, codeLang = '', codeLines = [];
      let inTable = false, tableRows = [], hasSeenSeparator = false;
      let inList = false, listItems = [], listType = 'ul';

      function flushList() {
        if (inList) {
          html += '<' + listType + '>' + listItems.join('') + '</' + listType + '>';
          listItems = []; inList = false;
        }
      }
      function flushTable() {
        if (inTable && tableRows.length) {
          html += '<table><thead><tr>' + tableRows[0] + '</tr></thead>';
          if (tableRows.length > 1) {
            html += '<tbody>';
            for (let i = 1; i < tableRows.length; i++) html += '<tr>' + tableRows[i] + '</tr>';
            html += '</tbody>';
          }
          html += '</table>';
          tableRows = []; inTable = false; hasSeenSeparator = false;
        }
      }
      function inline(t) {
        return t
          .replace(/`([^`]+)`/g, '<code>$1</code>')
          .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
          .replace(/\*([^*]+)\*/g, '<em>$1</em>')
          .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
      }

      for (const line of lines) {
        // Code blocks
        if (inCode) {
          if (line.startsWith('```')) {
            const gMap = { html:'grammars/html.json', javascript:'grammars/typescript.json', typescript:'grammars/typescript.json', css:'grammars/css.json', json:'grammars/json.json' };
            const gAttr = gMap[codeLang] ? ' grammar="' + gMap[codeLang] + '"' : '';
            html += '<snice-code-block language="' + codeLang + '"' + gAttr + '>' + codeLines.join('\n').replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</snice-code-block>';
            inCode = false; codeLines = [];
          } else {
            codeLines.push(line);
          }
          continue;
        }
        if (line.startsWith('```')) { flushList(); flushTable(); codeLang = line.slice(3).trim() || 'text'; inCode = true; continue; }

        // Skip markdown comments [//]: # (...) and HTML comments <!-- ... -->
        if (/^\[\/\/\]: #/.test(line)) continue;
        if (/^\s*<!--.*-->\s*$/.test(line)) continue;

        // Tables
        if (line.startsWith('|')) {
          flushList();
          const cells = line.split('|').slice(1, -1).map(c => c.trim());
          // Separator row (|---|---|)
          if (cells.every(c => /^[-:]+$/.test(c))) { hasSeenSeparator = true; continue; }
          if (!inTable) { inTable = true; hasSeenSeparator = false; }
          const tag = hasSeenSeparator ? 'td' : 'th';
          tableRows.push(cells.map(c => '<' + tag + '>' + inline(c) + '</' + tag + '>').join(''));
          continue;
        }
        if (inTable) flushTable();

        // Headings
        if (/^#{1,4}\s/.test(line)) {
          flushList();
          const lvl = line.match(/^(#+)/)[1].length;
          const tag = 'h' + Math.min(lvl + 1, 5);
          html += '<' + tag + '>' + inline(line.replace(/^#+\s*/, '')) + '</' + tag + '>';
          continue;
        }

        // Unordered lists
        if (/^[-*]\s/.test(line)) {
          if (inList && listType !== 'ul') flushList();
          inList = true; listType = 'ul';
          listItems.push('<li>' + inline(line.replace(/^[-*]\s*/, '')) + '</li>');
          continue;
        }

        // Ordered lists
        if (/^\d+\.\s/.test(line)) {
          if (inList && listType !== 'ol') flushList();
          inList = true; listType = 'ol';
          listItems.push('<li>' + inline(line.replace(/^\d+\.\s*/, '')) + '</li>');
          continue;
        }

        if (inList) flushList();
        if (line.trim() === '') continue;
        html += '<p>' + inline(line) + '</p>';
      }
      flushList(); flushTable();
      return html;
    }
```

**Step 2: Verify locally**

Start dev server, open components page, click "Read docs" on a component. Verify:
- No `[//]: #` text visible
- Tables render with proper headers
- Code blocks have grammar paths without `?v=`
- Numbered lists render as `<ol>`

**Step 3: Commit**

```bash
git add public/showcases/_footer.html
git commit -m "fix: mdToHtml parser — strip comments, fix tables, add numbered lists

- Strip [//]: # markdown comments and <!-- --> HTML comments
- Fix table parsing: th for header row, td for body rows
- Add ordered list support (1. 2. 3.)
- Remove hardcoded ?v= from grammar paths (deploy stamper handles this)"
```

---

## Task 3: Convert docs markdown comments to HTML comments

**Files:**
- Modify: all `docs/components/*.md` files (130 files, scripted)

**Step 1: Write and run a sed command to convert all markdown comments**

```bash
# Convert [//]: # (AI: ...) to <!-- AI: ... -->
sed -i 's/^\[\/\/\]: # (\(.*\))$/<!-- \1 -->/' docs/components/*.md
```

**Step 2: Verify conversion**

```bash
# Should be zero
grep -c '\[//\]: #' docs/components/*.md | grep -v ':0$' | wc -l
# Should be ~130
grep -c '<!-- AI:' docs/components/*.md | grep -v ':0$' | wc -l
```

**Step 3: Commit**

```bash
git add docs/components/
git commit -m "chore: convert markdown comments to HTML comments in component docs"
```

---

## Task 4: Add tabbed "More" panel to components page

**Files:**
- Modify: `public/showcases/_footer.html`

**Step 1: Update the drawer HTML (lines 5-13)**

Replace the help-drawer HTML with a tabbed version:

```html
  <!-- More panel -->
  <div class="help-overlay" id="help-overlay" style="display:none"></div>
  <aside class="help-drawer" id="help-drawer" style="visibility:hidden">
    <div class="help-drawer-header">
      <h3 id="help-drawer-title">Component</h3>
      <button class="help-drawer-close" id="help-drawer-close" aria-label="Close">&times;</button>
    </div>
    <div class="help-drawer-tabs">
      <button class="help-drawer-tab active" data-tab="docs">Docs</button>
      <button class="help-drawer-tab" data-tab="showcase">Full Showcase</button>
    </div>
    <div class="help-drawer-body" id="help-drawer-body"></div>
    <iframe class="help-drawer-iframe" id="help-drawer-iframe" style="display:none" sandbox="allow-scripts allow-same-origin"></iframe>
  </aside>
```

**Step 2: Add tab CSS (after existing help-drawer styles ~line 789)**

```css
    .help-drawer-tabs {
      display: flex;
      border-bottom: 1px solid var(--snice-color-border, rgba(128,128,128,0.2));
      flex-shrink: 0;
      padding: 0 1.25rem;
    }
    .help-drawer-tab {
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      color: var(--snice-color-text-secondary, #aaa);
      font-size: 0.8rem;
      font-weight: 500;
      padding: 0.6rem 0.75rem;
      cursor: pointer;
      transition: color 0.15s, border-color 0.15s;
      font-family: inherit;
    }
    .help-drawer-tab:hover { color: var(--snice-color-text, #eee); }
    .help-drawer-tab.active {
      color: var(--snice-color-primary, #2563eb);
      border-bottom-color: var(--snice-color-primary, #2563eb);
    }
    .help-drawer-iframe {
      flex: 1;
      border: none;
      width: 100%;
    }
```

**Step 3: Update the link injection (lines 394-407)**

Change "Read docs" to "More":

```javascript
          link.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg> More';
```

Also rename the CSS class from `.help-link` to `.more-link` (and update all references).

**Step 4: Rewrite the drawer logic (lines 633-689)**

Replace the help drawer logic with tabbed panel logic:

```javascript
    // More panel logic
    (function() {
      const overlay = document.getElementById('help-overlay');
      const drawer = document.getElementById('help-drawer');
      const body = document.getElementById('help-drawer-body');
      const iframe = document.getElementById('help-drawer-iframe');
      const title = document.getElementById('help-drawer-title');
      const closeBtn = document.getElementById('help-drawer-close');
      const tabs = drawer.querySelectorAll('.help-drawer-tab');
      const cache = {};
      let currentSlug = '';
      let currentTab = 'docs';

      function openDrawer() { overlay.style.display = ''; drawer.style.visibility = ''; drawer.classList.add('open'); overlay.classList.add('open'); document.body.style.overflow = 'hidden'; }
      function closeDrawer() { drawer.classList.remove('open'); overlay.classList.remove('open'); document.body.style.overflow = ''; }

      closeBtn.addEventListener('click', closeDrawer);
      overlay.addEventListener('click', closeDrawer);
      document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); });

      function showTab(tab) {
        currentTab = tab;
        tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
        if (tab === 'docs') {
          body.style.display = '';
          iframe.style.display = 'none';
          loadDocs(currentSlug);
        } else {
          body.style.display = 'none';
          iframe.style.display = '';
          loadShowcase(currentSlug);
        }
      }

      tabs.forEach(t => t.addEventListener('click', () => showTab(t.dataset.tab)));

      async function fetchDoc(slug) {
        if (cache[slug]) return cache[slug];
        const candidates = DOC_SLUGS[slug] ? DOC_SLUGS[slug] : [slug];
        let combined = '';
        for (const name of candidates) {
          try {
            const res = await fetch('docs/components/' + name + '.md');
            if (res.ok) combined += (combined ? '\n\n---\n\n' : '') + await res.text();
          } catch(e) {}
        }
        if (!combined) {
          for (const name of candidates) {
            try {
              const res = await fetch('docs/ai/components/' + name + '.md');
              if (res.ok) combined += (combined ? '\n\n---\n\n' : '') + await res.text();
            } catch(e) {}
          }
        }
        cache[slug] = combined || null;
        return cache[slug];
      }

      async function loadDocs(slug) {
        if (currentTab !== 'docs') return;
        body.innerHTML = '<p style="opacity:0.5">Loading...</p>';
        const md = await fetchDoc(slug);
        if (md) {
          body.innerHTML = mdToHtml(md);
        } else {
          body.innerHTML = '<p style="opacity:0.5">No documentation available yet.</p>';
        }
      }

      function loadShowcase(slug) {
        if (currentTab !== 'showcase') return;
        const src = 'showcase/' + slug + '.html';
        if (iframe.src !== location.origin + '/' + src) {
          iframe.src = src;
        }
      }

      document.addEventListener('click', async e => {
        const btn = e.target.closest('.more-link');
        if (!btn) return;
        e.preventDefault();
        currentSlug = btn.dataset.slug;
        title.textContent = btn.dataset.name;
        openDrawer();
        showTab(currentTab); // stay on whichever tab was last active
      });
    })();
```

**Step 5: Verify locally**

Open components page in dev. Click "More" on any component:
- Panel opens with Docs tab active showing rendered markdown
- Click "Full Showcase" tab — iframe loads (will 404 in dev until showcase files are deployed, that's expected)
- Switch to another component — stays on current tab, content updates
- Close with X, Escape, or overlay click

**Step 6: Commit**

```bash
git add public/showcases/_footer.html
git commit -m "feat: unified More panel with Docs + Full Showcase tabs

Replaces 'Read docs' link with 'More' that opens a tabbed side panel.
Docs tab shows markdown docs. Full Showcase tab loads an iframe.
Tab choice persists when switching between components."
```

---

## Task 5: Rename demo.html → full-showcase.html

**Files:**
- Rename: all `components/*/demo.html` → `components/*/full-showcase.html`

**Step 1: Rename all files**

```bash
for dir in components/*/; do
  name=$(basename "$dir")
  [[ "$name" == *.* ]] && continue
  [ -f "$dir/demo.html" ] && mv "$dir/demo.html" "$dir/full-showcase.html"
done
```

**Step 2: Verify**

```bash
# Should be zero
ls components/*/demo.html 2>/dev/null | wc -l
# Should be ~130
ls components/*/full-showcase.html 2>/dev/null | wc -l
```

**Step 3: Update vite.config.ts optimizeDeps entries if needed**

Check if `public/**/*.html` covers the renamed files. Since full-showcase.html is in `components/` not `public/`, it should be fine — but verify Vite still serves them at `http://localhost:5566/components/<name>/full-showcase.html`.

**Step 4: Commit**

```bash
git add -A
git commit -m "refactor: rename demo.html to full-showcase.html across all components"
```

---

## Task 6: Create build-deploy.js

**Files:**
- Create: `scripts/build-deploy.js`

**Step 1: Write the build-deploy script**

```javascript
#!/usr/bin/env node
// Builds the deploy artifact in dist/site/
// 1. Copies public/ → dist/site/
// 2. Copies components/<name>/full-showcase.html → dist/site/showcase/<name>.html
//    with .ts imports rewritten to CDN <script> tags
// 3. Stamps all HTML in dist/site/

import { cpSync, mkdirSync, rmSync, readdirSync, readFileSync, writeFileSync, statSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const publicDir = join(root, 'public');
const componentsDir = join(root, 'components');
const siteDir = join(root, 'dist', 'site');

// Read .wip exclusions
const wipPath = join(componentsDir, '.wip');
const wipList = existsSync(wipPath)
  ? readFileSync(wipPath, 'utf-8').split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'))
  : [];

// 1. Clean and copy public/ → dist/site/
console.log('Copying public/ → dist/site/...');
rmSync(siteDir, { recursive: true, force: true });
cpSync(publicDir, siteDir, { recursive: true });

// 2. Copy and transform full-showcase pages
console.log('Building showcase pages...');
const showcaseDir = join(siteDir, 'showcase');
mkdirSync(showcaseDir, { recursive: true });

for (const entry of readdirSync(componentsDir)) {
  if (entry.startsWith('.') || entry.includes('.')) continue;
  if (wipList.includes(entry)) continue;
  const srcFile = join(componentsDir, entry, 'full-showcase.html');
  if (!existsSync(srcFile)) continue;

  let html = readFileSync(srcFile, 'utf-8');

  // Rewrite theme.css path
  html = html.replace(
    /href="\.\.\/theme\/theme\.css"/g,
    'href="/theme/theme.css"'
  );

  // Rewrite <script type="module"> with .ts imports → CDN script tags
  // Pattern: import './snice-<name>.ts' or import '../other/snice-other.ts'
  // Replace the entire <script type="module">...</script> block
  html = html.replace(
    /<script type="module">([\s\S]*?)<\/script>/g,
    (match, content) => {
      // Extract all component imports
      const imports = [];
      const importRe = /import\s+['"](?:\.\.?\/)*(?:\.\.\/)?(?:components\/)?([^/]+)\/snice-([^'"]+)\.ts['"]/g;
      const simpleImportRe = /import\s+['"]\.\/snice-([^'"]+)\.ts['"]/g;

      let m;
      while ((m = importRe.exec(content)) !== null) {
        imports.push(m[1]);
      }
      while ((m = simpleImportRe.exec(content)) !== null) {
        imports.push(m[1]);
      }

      // If no .ts imports found, keep the script as-is
      if (imports.length === 0) return match;

      // Deduplicate
      const unique = [...new Set(imports)];

      // Build CDN script tags
      let scripts = '<script src="/components/snice-runtime.min.js"><\/script>\n';
      for (const comp of unique) {
        scripts += `  <script src="/components/snice-${comp}.min.js"><\/script>\n`;
      }

      // Keep any non-import code as a separate script
      const nonImportLines = content.split('\n').filter(line => {
        const trimmed = line.trim();
        return trimmed && !trimmed.startsWith('import ') && !trimmed.startsWith('await import(');
      });
      if (nonImportLines.length > 0) {
        scripts += '  <script>\n' + nonImportLines.join('\n') + '\n  <\/script>\n';
      }

      return scripts;
    }
  );

  // Also handle import patterns like: import { element } from '../../src/index.ts'
  // These are framework imports — not needed in CDN mode (runtime handles it)
  html = html.replace(
    /<script type="module">\s*import\s+.*from\s+['"]\.\.\/\.\.\/src\/index\.ts['"][\s\S]*?<\/script>/g,
    ''
  );

  writeFileSync(join(showcaseDir, entry + '.html'), html);
}

const showcaseCount = readdirSync(showcaseDir).length;
console.log(`  ${showcaseCount} showcase pages built`);

// 3. Stamp everything
console.log('Stamping assets...');
execSync('node scripts/stamp-assets.js --dir ' + siteDir, { stdio: 'inherit', cwd: root });

console.log('Deploy artifact ready at dist/site/');
```

**Step 2: Update stamp-assets.js to accept --dir flag**

Add this near the top of `scripts/stamp-assets.js`, after the existing `clean` const:

```javascript
const dirFlag = process.argv.indexOf('--dir');
const targetDir = dirFlag !== -1 ? process.argv[dirFlag + 1] : publicDir;
```

And change `const count = processDir(publicDir)` at the bottom to:

```javascript
const count = processDir(targetDir);
```

**Step 3: Verify the script runs**

```bash
node scripts/build-deploy.js
ls dist/site/showcase/ | head -10
cat dist/site/showcase/button.html | grep -c '?v='
```

Expected: showcase files exist, stamps present

**Step 4: Commit**

```bash
git add scripts/build-deploy.js scripts/stamp-assets.js
git commit -m "feat: add build-deploy.js for stamped deploy artifact in dist/site/"
```

---

## Task 7: Update package.json, wrangler.toml, vite.config.ts, _headers

**Files:**
- Modify: `package.json:119-127`
- Modify: `wrangler.toml:8`
- Modify: `vite.config.ts:55-69`
- Modify: `public/_headers`

**Step 1: Update package.json scripts**

```json
    "postrelease": "npm run website:deploy",
    "website:build": "node scripts/build-website.js && npm run build:showcases",
    "website:build:full": "npm run build:cdn && npm run website:build",
    "dev:website": "npm run website:build && vite --port 52891",
    "website:dev": "npm run website:build && vite --port 52891",
    "website:deploy": "npm run website:build:full && node scripts/build-deploy.js && npx wrangler deploy",
```

Remove `website:stamp` and `website:unstamp` lines.

**Step 2: Update wrangler.toml**

```toml
[assets]
directory = "dist/site"
```

**Step 3: Update vite.config.ts cacheHeaders()**

```typescript
function cacheHeaders() {
  return {
    name: 'cache-headers',
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        res.setHeader('Cache-Control', 'no-store');
        next();
      });
    },
  };
}
```

**Step 4: Update public/_headers**

Add showcase rule:

```
/showcase/*
  Cache-Control: public, max-age=31536000, immutable
```

**Step 5: Verify**

```bash
# Dev server should work without stamps
npm run website:build
# Deploy build should produce stamped artifact
node scripts/build-deploy.js && grep -c '?v=' dist/site/index.html
```

**Step 6: Commit**

```bash
git add package.json wrangler.toml vite.config.ts public/_headers
git commit -m "chore: deploy from dist/site/, no-cache in dev, add showcase headers

- website:build no longer stamps source files
- website:deploy builds artifact in dist/site/ with stamps
- wrangler deploys from dist/site/
- Dev server sends no-store on all assets
- /showcase/* served with immutable cache headers"
```

---

## Task 8: Update postrelease to use new deploy

**Files:**
- Modify: `package.json:119`

**Step 1: Update postrelease**

Change:
```json
"postrelease": "npx wrangler deploy",
```
To:
```json
"postrelease": "npm run website:deploy",
```

This is already covered in Task 7 Step 1 — just verify it's correct.

**Step 2: Verify the full pipeline**

```bash
npm run website:build       # builds public/, no stamps
ls dist/site 2>/dev/null    # should not exist yet
npm run website:deploy --dry-run  # or just run build-deploy.js
ls dist/site/showcase/ | wc -l    # should be ~130
grep '?v=' dist/site/index.html | head -3  # should have stamps
grep '?v=' public/index.html | head -3     # should NOT have stamps
```

**Step 3: Commit (if not already done in Task 7)**

```bash
git add package.json
git commit -m "chore: postrelease uses website:deploy pipeline"
```

---

## Summary of commits

1. `chore: strip asset stamps from source files`
2. `fix: mdToHtml parser — strip comments, fix tables, add numbered lists`
3. `chore: convert markdown comments to HTML comments in component docs`
4. `feat: unified More panel with Docs + Full Showcase tabs`
5. `refactor: rename demo.html to full-showcase.html across all components`
6. `feat: add build-deploy.js for stamped deploy artifact in dist/site/`
7. `chore: deploy from dist/site/, no-cache in dev, add showcase headers`

## Task dependency order

```
Task 1 (strip stamps) — independent, do first
Task 2 (fix mdToHtml) — independent
Task 3 (convert comments) — independent, can parallel with Task 2
Task 4 (tabbed panel) — depends on Task 2
Task 5 (rename demo→full-showcase) — independent
Task 6 (build-deploy.js) — depends on Task 5 (needs full-showcase.html filenames)
Task 7 (config updates) — depends on Task 6
Task 8 (verify) — depends on Task 7
```

Tasks 1, 2, 3, 5 can run in parallel. Then 4, then 6, then 7, then 8.

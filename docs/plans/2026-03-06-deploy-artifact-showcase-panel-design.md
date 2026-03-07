# Deploy Artifact, Full Showcase Panel & Docs Panel Fixes

Date: 2026-03-06

## Summary

Three interconnected changes:
1. Stop committing stamped files — build a deploy artifact in `dist/site/`
2. Unified "More" side panel with Docs + Full Showcase tabs
3. Fix the mdToHtml parser and clean up docs

## 1. Deploy Artifact

Source files (`public/`) stay clean. Stamps only exist in `dist/site/`.

### Changes

- `stamp-assets.js` — add `--output <dir>` mode: copies public/ to target, stamps the copy
- New `scripts/build-deploy.js` — orchestrates: copy public/ → dist/site/, copy full-showcase pages → dist/site/showcase/<name>.html (rewrite .ts imports to CDN scripts), stamp everything
- `package.json`:
  - `website:deploy` = `npm run website:build:full && node scripts/build-deploy.js && npx wrangler deploy`
  - Remove `website:stamp` from `website:build`
  - Remove `website:stamp` and `website:unstamp` scripts
- `wrangler.toml` — `directory = "dist/site"`
- `vite.config.ts` — `cacheHeaders()` → `no-store` on all assets in dev
- `_headers` — add `/showcase/*` with `max-age=31536000, immutable`
- One-time: run `website:unstamp` to strip all `?v=` from source, commit clean

### Flow

```
website:build (dev)     → builds into public/, no stamps
website:deploy (prod)   → website:build:full
                        → build-deploy.js:
                            1. rm -rf dist/site
                            2. cp -r public/ dist/site/
                            3. for each components/<name>/full-showcase.html:
                               copy → dist/site/showcase/<name>.html
                               rewrite .ts imports → CDN <script> tags
                               fix theme.css path
                            4. stamp all HTML in dist/site/
                        → wrangler deploy (from dist/site/)
```

## 2. Unified "More" Panel

### UX

- "Read docs" link on each component `<h3>` renamed to "More"
- Opens the existing side panel with two tabs: **Docs** | **Full Showcase**
- Lands on Docs tab by default
- Full Showcase tab loads `/showcase/<name>.html` in an iframe
- Tab choice persists while switching between components (stays on whichever tab you're on)
- Panel title shows component name, close with X or Escape

### Panel layout

```
+----------------------------------+
|  Component Name             [x]  |
|  [Docs] [Full Showcase]         |
|  --------------------------------|
|                                  |
|  (content: markdown or iframe)   |
|                                  |
+----------------------------------+
```

### Implementation

- Reuse existing drawer HTML/CSS/JS in `_footer.html`
- Add tab bar below header, above body
- Docs tab: existing markdown fetch + mdToHtml render
- Full Showcase tab: create/reuse iframe, set src to `/showcase/<name>.html`
- Lazy-load: don't fetch docs or load iframe until that tab is activated

## 3. Docs Panel / mdToHtml Fixes

| Fix | Detail |
|-----|--------|
| Strip markdown comments | Ignore lines matching `[//]: # (...)` |
| Switch docs to HTML comments | Change all 130 files from `[//]: #` to `<!-- ... -->` |
| Table parsing | Fix th/td — first row = th, rows after separator = td |
| Numbered lists | Handle `1. ` prefix like `- ` |
| Remove hardcoded grammar stamps | Remove `?v=ff60e40` from mdToHtml — deploy stamper handles it |

## 4. Full Showcase Files

- Rename `components/<name>/demo.html` → `components/<name>/full-showcase.html`
- Standardize to consistent template across all 130+ files
- Dev: Vite serves them with .ts imports
- Deploy: build-deploy.js copies to dist/site/showcase/<name>.html with CDN imports

### Consistent template structure

Each full-showcase.html follows:
1. DOCTYPE + head with theme.css
2. Body with component name as h1
3. Sections for each feature group (variants, sizes, states, interactions, etc.)
4. Script tag importing the component
5. Uses theme tokens, works in light/dark mode

## 5. Stamp Coverage

All generated assets stamped and served immutable:
- All src=/href= to local assets in HTML
- iframe URLs for full showcases
- Grammar JSON files
- JS/CSS/images
- `_headers`: `/showcase/*`, `/components/*`, `/grammars/*`, `/theme/*`, `/styles.css`, `/images/*` all immutable

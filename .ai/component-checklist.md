# Component Checklist

Every component must satisfy ALL items before considered complete.

## Pre-Implementation
- [ ] Read `theme.css` — understand available CSS custom properties
- [ ] Read `.ai/coding-standards.md` — understand patterns, fallbacks, units
- [ ] If not ready for release, add directory name to `components/.wip` (excludes from all builds)

## Implementation
- [ ] Component file: `components/<name>/snice-<name>.ts`
- [ ] Types file: `components/<name>/snice-<name>.types.ts` (interfaces, event maps)
- [ ] Styles file: `components/<name>/snice-<name>.css`
- [ ] All CSS uses `var(--snice-property, fallback)` pattern — fallback must be the exact default value from `theme.css`, not an arbitrary value
- [ ] Spacing/typography in rem, borders/shadows in px
- [ ] Uses snice decorators (`@query`, `@on`, `@dispatch`, `@ready`, `@dispose`, `@observe`, `@watch`)
- [ ] Responsive design using container queries (not media queries) for layout breakpoints
- [ ] Exported from `src/index.ts`

## Testing
- [ ] Unit tests: `tests/components/<name>.test.ts` — all passing
- [ ] CDN build test: component included in `tests/cdn-builds.test.ts`
- [ ] CDN runtime test: component works with shared runtime
- [ ] React adapter test: `tests/react-adapters/<name>.test.tsx`
- [ ] Light mode: component renders correctly
- [ ] Dark mode: component renders correctly (`[data-theme="dark"]`)
- [ ] Without theme: component works with fallback values only
- [ ] Focus states: visible and meet contrast standards

## React Adapter
- [ ] Metadata added to `scripts/generate-react-adapters.js`
- [ ] Generated adapter: `adapters/react/<name>.tsx`
- [ ] Exported from `adapters/react/index.ts`
- [ ] Test config added to `scripts/generate-react-tests.js`
- [ ] Run: `npm run generate:react-adapters`
- [ ] Run: `npm run generate:react-tests`

## CDN Build
- [ ] Build: `npm run build:core && npm run build:cdn`
- [ ] Output: `dist/cdn/<name>/snice-<name>.min.js`
- [ ] Works with shared runtime (`snice-runtime.min.js`)

## Documentation
- [ ] Human docs: `docs/components/<name>.md` — detailed, with examples and explanations
- [ ] AI docs: `docs/ai/components/<name>.md` — LOW TOKEN, concise: type signatures, bullets, code over prose, no tutorials, pure reference
- [ ] Both docs follow the **standard section order** (see below)
- [ ] Both docs are **verified accurate** against source code (properties, methods, events, slots, CSS parts)
- [ ] Demo page: `components/<name>/demo.html`
- [ ] Demo uses theme tokens (not hard-coded colors/spacing)
- [ ] Demo works in both light and dark modes

### Standard Docs Section Order

Both human and AI docs MUST follow this section order. Omit sections that don't apply.

```
<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/<name>.md -->

# Component Name

Description paragraph.

## Table of Contents        ← links to all sections below
## Components               ← only if multi-element (e.g. accordion + accordion-item)
## Properties               ← table format in human docs, code block in AI docs
## Methods
## Events
## Slots
## CSS Parts                ← or "## CSS Custom Properties" if applicable
## Basic Usage              ← simplest example + import statement
## Examples
## Keyboard Navigation      ← only if applicable
## Accessibility
```

**Rules:**
- TOC anchor links: lowercase, spaces→hyphens (e.g. `[CSS Parts](#css-parts)`)
- No `## Importing` section (merge imports into Basic Usage)
- No `## Browser Support` or `## Common Patterns` sections
- AI docs use same order, low-token format: type signatures in code blocks, bullets, arrow notation for events
- AI comment is an invisible HTML comment `<!-- AI: ... -->`

## MCP Server Catalogue
- [ ] AI docs file exists at `docs/ai/components/<name>.md` — the MCP server (`bin/mcp-server.js`) auto-discovers components from this directory
- [ ] Verify component appears in `list_components` tool output
- [ ] Note: No code changes needed in mcp-server.js — it reads all `.md` files from `docs/ai/components/` at startup

## Website Integration
- [ ] Showcase fragment: `public/showcases/<name>.html`
- [ ] Fragment starts with `<div class="comp-section">` and has `<h3>Component Name</h3>` as first child
- [ ] Added to `public/showcases/manifest.json` (under correct category)
- [ ] Script tag in `public/showcases/_footer.html`
- [ ] Search aliases added to `SEARCH_ALIASES` in `public/showcases/_footer.html` (e.g. "dropdown" → "select")
- [ ] Rebuild: `node public/build-showcases.js` (pre-renders sidebar links + injects data attributes)
- [ ] Copy CDN builds: `node scripts/build-website.js`

## Final Verification
- [ ] `npm run build` — succeeds
- [ ] `npm test` — all tests pass
- [ ] Remove from `components/.wip` if previously listed
- [ ] Update `.ai/tasks.md` — mark component complete

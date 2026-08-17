# Development Guide (AI-Optimized)

For Snice framework development. User docs: [README.md](../../README.md)

## Component Requirements

All components MUST:
1. Support CDN builds (bundle with runtime)
2. Have React adapter (React 17+)
3. Be tested (CDN + React)
4. Have Storybook stories at `packages/components/src/<name>/snice-<name>.stories.ts` — one story per `<h2>` section in `website/showcases/<name>/full.html`, using `@storybook/html-vite` and `document.createElement` (see `docs/ai/STORYBOOK.md`)

## Build Commands

```bash
# Distribution
npm run build:distribution      # Core, React runtime, components, declarations
npm run build:types             # .d.ts generation
npm run build:cdn               # All CDN bundles
npm run build:react             # React adapters
npm run build                   # Everything
npm run build:website           # Public website + assembled showcases
npm run build:website:full      # CDN assets + website

# CDN component
snice build-component <name> [--output=dir] [--format=iife] [--with-theme]

# Generators
npm run generate:react-adapters  # Generate React wrappers
npm run generate:react-tests     # Generate test files
```

## Test Commands

```bash
npm test                        # Required complete gate (source+built+browser+site)
npm run test:source             # Tests importing package sources
npm run test:matrix             # Component feature-combination matrices (fuzz tier, opt-in)
npm run test:matrix:visual      # Same matrices in a real browser (on demand, chromium)
npm run test:distribution       # Fresh build, then same tests against dist/
npm run test:cdn                # Fresh CDN build + artifact/runtime tests
npm run test:react              # Fresh adapters + React tests
npm run test:watch              # Watch mode
npm run test:coverage:core      # Enforce >90% statements/branches/functions/lines
npm run test:browsers:install   # Install Chromium + Firefox + WebKit
npm run test:browser:framework  # Required framework/table E2E in all 3 engines
npm run test:browser:website    # Generated deployment E2E in all 3 engines
npm run test:browser            # Both browser gates
npm run gauntlet                # Blind local-model checker gauntlet
```

`npm test` is intentionally comprehensive. Core coverage is measured across
`element.ts`, `parts.ts`, `reactive.ts`, `render-root.ts`, `render.ts`,
`repeat.ts`, `snice-element.ts`, and `template.ts`; every aggregate metric must
be strictly greater than 90%. Browser commands manage their own local servers.

## Test Tiers

| Tier | Command | Cost | When |
|------|---------|------|------|
| Everyday | `vitest run` / `npm run test:source` | ~26s for `tests/components` | Every change |
| Matrix (fuzz) | `npm run test:matrix` | Minutes; all components | Any component rendering change; once inside `npm test` |
| Visual | Playwright (`tests/live`) | Slowest | On request |
| Visual matrix | `npm run test:matrix:visual` | Minutes; every component's specs in `tests/live/matrix/` | On demand only; never in the gate |

- Canonical layout: `tests/matrix/<component>/*.test.ts` (matrix),
  `tests/matrix/<component>/smoke.test.ts` (default-loop slice),
  `tests/matrix/*.ts` (shared oracles),
  `tests/live/matrix/<component>/<component>-visual.spec.ts` (visual tier),
  `tests/live/fixtures/<component>/` (fixtures).
- `vitest.config.ts` `test.exclude` drops `tests/matrix/**/!(smoke).test.ts`
  from the default include, the same way `tests/live` is dropped. Plain
  `vitest run` pays for the smoke slices only.
- `npm run test:matrix` = `vitest run --config vitest.matrix.config.ts`. That
  config inherits `vitest.config.ts` and replaces `exclude` with the base list
  minus the matrix pattern (mergeConfig concatenates arrays, so inheriting it
  would keep the entry that hides the suites). It throws if the base config
  stops excluding the pattern. Smoke slices run in both tiers — intended.
- Each `smoke.test.ts` stays IN the default include: one combo per feature
  family, plus the marquee regressions. Budget a few seconds per component —
  add new combos to the matrix, not to the smoke file.
- Helper modules under `tests/matrix/` (`matrix-utils.ts`, the per-slice
  `*-support.ts`) stay importable from outside; the exclusion removes files
  from test COLLECTION, not from module resolution.
- `npm test` runs the matrices as their own `matrix suite` stage, exactly
  once, source-flavoured (see `tooling/testing/run-full-tests.js`).

## True-Visual Matrix (on demand)

`tests/live/matrix/` — the real-browser twin of `tests/matrix/`.
happy-dom does no layout, so the DOM matrix owns VALUE truth only; this tier
owns VISUAL truth.

```bash
npm run test:matrix:visual                      # chromium only (default)
npm run test:matrix:visual -- --all-engines     # chromium + firefox + webkit
npm run test:matrix:visual -- --project=webkit  # explicit engine wins
npm run test:matrix:visual -- --grep squish     # all other flags pass through
```

- ON DEMAND. Not in `npm test`; `tests/playwright.config.ts` sets
  `testIgnore: ['live/matrix/**']` so `test:browser:framework` (targets all of
  `tests/live`) cannot sweep it in. Own config: `tests/playwright.matrix.config.ts`.
- Runner `tooling/testing/run-visual-matrix-tests.js` manages vite on :5566 —
  probes `127.0.0.1` AND `[::1]` (servers bind v6), reuses a listener, kills
  only a server it started. It then requires the fixture URL to return 200
  before starting Playwright: a listener is not a server, and a wedged :5566
  (vite rebuilds components synchronously on source change) otherwise surfaces
  as hundreds of `net::ERR_ABORTED` specs instead of one clear message.
- Layout: `tests/live/matrix/<component>/<component>-visual.spec.ts` (the table
  alone splits into `matrix-{local,remote,marquee}.spec.ts`), each driving
  `tests/live/fixtures/<component>/matrix.html` (fixtures, NOT showcases). A
  fixture exposes `window.matrix.mount(combo)` and owns anything
  carrying functions — column definitions, callbacks — which cannot cross the
  Playwright boundary.
- Size the specs to the component: the table is the ceiling, not the template.
  Its combos are the FULL product `{local,remote}` x 6 pipelines x 3 delivery
  patterns x 2^5 `{virtualize,height,squish,striped,selectable}` = 1152,
  generated by `generateCombos()` in `tests/live/matrix/matrix-harness.ts`; a
  divider's are two dozen. `--all-engines` triples the wall time.

**Two layers per component** (the split is documented in the table harness
header; every component's specs follow it):

| Layer | Scope | What it asserts |
|-------|-------|-----------------|
| 1. geometry + computed style + `elementFromPoint` | every combo, one `page.evaluate` each on a shared open page | the component's own documented visual contract. Table: row/cell boxes disjoint + ascending + contained; squish right edge on the frame's inner edge and ellipsis not mid-glyph clip; sized host filled to bottom; virtual window contiguous between spacers; `striped` = 2 row colours, unstriped = 1; selection checkbox painted at non-zero size; three hit-test probes per visible cell must land inside that cell |
| 2. real screenshots | a small pinned marquee set (table: 6 combos x 2 colour schemes) | table: striping, loading spinner, empty state, squished right edge, fill row, density — decoded in-browser, judged on WCAG contrast between painted samples; PNGs written to `test-results/matrix-visual/` |

Layer 2 exists because layer 1 cannot tell a colour that DIFFERS from one that
differs VISIBLY (`striped` once applied correctly while painting two luminance
points from the dark surface). Keep every marquee set small — screenshots are
the expensive layer. New combinations go in the layer-1 generator.

**Known defects are pinned, never softened** (`.ai/fuzzing.md` policy). A
component's specs pin theirs with `test.fail()` and the finding written above
it — the Playwright counterpart of the DOM matrix's `it.fails`. The table
harness uses `WAIVERS` in `matrix-harness.ts`, stricter still because one combo reports many
problems: a waiver names the EXACT message it excuses, every other problem in
the same combo still fails, and a waiver whose message stops appearing fails
itself so it must be deleted. Currently pinned there:
`VISUAL-MATRIX-fill-1` (96 combos) — a local, sized, non-virtualized table that
renders its body a second time appends an inert filler even though the content
already overflows the frame.

## Dumb-Agent Gauntlet

Internal checker hardening: `npm run gauntlet` uses the comprehensive multi-file
application sample. Focused probes remain available with
`--sample daemon|events|request-response|router`.

- Inline prompt: `--prompt "..."`; file prompt: `--prompt-file path`.
- Subset: `--models qwen3-0.6b,lfm2.5-350m`; default: all.
- Auto-downloads pinned llama.cpp + size/SHA-256-pinned GGUFs into `.local/`.
- Produces blind raw output plus checker, TypeScript, and Vite logs per model.
- No token/time cap; exact-output repetition is preserved and classified.
- Full workflow/classification rules: `.ai/testing.md`.

## File Structure

```
packages/
  core/src/                     # Framework engine
  components/
    .wip                        # WIP exclude list
    src/my-comp/
      snice-my-comp.ts          # Component class
      snice-my-comp.types.ts    # Interfaces & types
      snice-my-comp.css         # Styles
  react/src/                    # React router/provider integration

website/
  public/                       # Public website sources/generated pages
  showcases/my-comp/
    card.html                   # Components-page card
    full.html                   # Complete feature showcase
  showcases/shared/             # Assembly manifest/head/footer

examples/                       # Standalone customer-readable applications

adapters/react/
  wrapper.tsx                   # Adapter core
  types.ts                      # TypeScript types
  utils.ts                      # Utilities
  button.tsx                    # Generated adapters
  ...

tests/
  components/                   # Component tests
  react-adapters/              # React tests
  cdn-builds.test.ts           # CDN tests

tooling/
  build/                        # Incremental and size tooling
  generators/                   # Metadata/React/version generators
  shared/wip-components.js     # Shared .wip parser
  testing/                      # Managed browser-test runners
  website/                      # Website/showcase build tools
```

`adapters/` and `bin/` remain at the root because they are published package
surfaces. Their npm paths and CLI template layout are compatibility contracts.

## WIP Components

`packages/components/.wip` — one directory name per line, `#` comments. Excludes components from the distribution, CDN, React adapters, and website. Parsed by `tooling/shared/wip-components.js`. Remove the line to publish the component.

## Adding Components

1. Create `packages/components/src/my-comp/snice-my-comp.ts`, its types, CSS, and Storybook stories.
2. Add any component-specific adapter overrides to `tooling/generators/generate-react-adapters.js`.
3. Add test config to `tooling/generators/generate-react-tests.js`.
4. Run generators:
   ```bash
   npm run generate:react-adapters
   npm run generate:react-tests
   ```
5. Create docs: `docs/components/my-comp.md` + `docs/ai/components/my-comp.md`.
6. Create `website/showcases/my-comp/card.html` and `full.html`; add the card to `website/showcases/shared/manifest.json`.
7. Run `npm run build && npm test`.

## CDN Builds

**Config:** `rollup.config.cdn.js`

All CDN builds use the shared runtime (external `snice` imports). Load `snice-runtime.min.js` once, then load component builds.

**Output:**
- Runtime: `dist/cdn/runtime/snice-runtime.min.js`
- Components: `dist/cdn/<name>/snice-<name>.min.js`
- IIFE: `.js` + `.min.js`
- Sourcemaps + README

**Size:** Runtime ~34KB gzip, components ~1-118KB each

**Features:**
- Shared runtime (external snice imports)
- Runtime check guard (warns if runtime not loaded)
- Tree-shaken
- Multiple formats

**CLI:**
```bash
snice build-component button
```

## React Adapters

**Generator:** `tooling/generators/generate-react-adapters.js`

**Core Files:**
- `adapters/react/wrapper.tsx` - `createReactAdapter()`
- `adapters/react/types.ts` - TypeScript defs
- `adapters/react/utils.ts` - Helpers

**Generated:**
- Per-component `.tsx` files
- `index.ts` barrel export

**Features:**
- Prop mapping (camelCase ↔ kebab-case)
- Event callbacks
- Ref forwarding with `useImperativeHandle`
- Form integration (value/onChange)
- React 17/18/19 support

**Metadata Format:**
```javascript
{
  componentName: {
    properties: ['prop1', 'prop2'],
    events: { 'my-event': 'onMyEvent' },
    isFormAssociated: boolean
  }
}
```

## Test Generation

**Generator:** `tooling/generators/generate-react-tests.js`

**Metadata Format:**
```javascript
{
  'component-name': {
    isForm: boolean,
    valueType: 'string'|'number'|'boolean',
    properties: ['prop1', 'prop2'],
    events: ['onChange', 'onClick'],
    variants: ['primary', 'secondary'],
    sizes: ['small', 'medium', 'large']
  }
}
```

**Test Coverage:**
- Basics: defined, displayName, ref, children
- Properties: acceptance, types, multiple
- Events: callbacks, types, multiple
- Forms: value, name, disabled, onChange
- Variants/Sizes: all values accepted

**Helpers:** `tests/react-adapters/test-helpers.tsx`
- `testComponent(config)` - Full suite
- `testComponentBasics()` - Basic tests
- `testComponentProperties()` - Prop tests
- `testComponentEvents()` - Event tests
- `testFormComponent()` - Form tests
- `testComponentVariants()` - Variant tests
- `testComponentSizes()` - Size tests

## Component Template

**Component file** (`snice-my-comp.ts`):
```typescript
import { element, property, render, styles } from 'snice';
import { html, css } from 'snice';
import componentStyles from './snice-my-comp.css?inline';
import type { SniceMyCompElement } from './snice-my-comp.types';

@element('snice-my-comp')
export class SniceMyComp extends HTMLElement implements SniceMyCompElement {
  @property() variant = 'default';
  @property() size = 'medium';

  @render()
  renderContent() {
    return html`<div class="comp"><slot></slot></div>`;
  }

  @styles()
  componentStyles() {
    return css`${componentStyles}`;
  }
}
```

**Types file** (`snice-my-comp.types.ts`):
```typescript
export interface SniceMyCompElement extends HTMLElement {
  variant: 'default' | 'primary' | 'secondary';
  size: 'small' | 'medium' | 'large';
}

export interface SniceMyCompEventMap {
  'my-event': CustomEvent<{ value: string }>;
}
```

**Why separate types:** Controllers can import types without importing the component, avoiding circular dependencies. Components import and register themselves; types are pure interfaces.

**VS Code file nesting:** Add to `.vscode/settings.json` or `.devcontainer/devcontainer.json`:
```json
{
  "explorer.fileNesting.enabled": true,
  "explorer.fileNesting.patterns": {
    "*.ts": "${capture}.types.ts, ${capture}.css"
  }
}
```

## Release

```bash
npm run release       # Semantic release
npm run release:dry-run # Dry run
```

Conventional commits:
- `feat:` → minor
- `fix:` → patch
- `BREAKING CHANGE:` → major

## Docs

Update BOTH:
- `docs/*.md` - Detailed, user-friendly
- `docs/ai/*.md` - Concise, token-efficient

Format for AI docs:
- Type signatures over prose
- Bullets over paragraphs
- Code over text
- No tutorials

## Common Tasks

**Update component:**
1. Modify source
2. Update docs (both)
3. Update `website/showcases/<name>/full.html` to demo new features
4. Update `website/showcases/<name>/card.html` showcase fragment
5. Regenerate if API changed
6. Run tests
7. Rebuild showcases: `npm run build:website`

**Debug tests:**
```bash
npm run test:watch           # Watch mode
npm run test:ui              # Vitest UI
npm run test:coverage        # General coverage report
npm run test:coverage:core   # Enforced core-engine report
```

**Add build format:**
1. Update `rollup.config.cdn.js`
2. Update CLI in `bin/snice.js`
3. Update docs
4. Test

## Key Implementations

**CDN bundling:**
- Shared runtime (external snice imports)
- Runtime check guard on IIFE builds
- Inline CSS with minification
- Multiple formats via Rollup

**React adapters:**
- `createReactAdapter()` wraps with `forwardRef`
- Props → element properties
- Events → callbacks
- Methods via `useImperativeHandle`

**Test generation:**
- Metadata → test files
- Helpers provide suites
- Auto-generated per component

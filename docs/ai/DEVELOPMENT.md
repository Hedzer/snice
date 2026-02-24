# Development Guide (AI-Optimized)

For Snice framework development. User docs: [README.md](../../README.md)

## Component Requirements

All components MUST:
1. Support CDN builds (bundle with runtime)
2. Have React adapter (React 17+)
3. Be tested (CDN + React)

## Build Commands

```bash
# Core
npm run build:core              # dist/ output
npm run build:types             # .d.ts generation
npm run build:cdn               # All CDN bundles
npm run build:react             # React adapters
npm run build                   # Everything

# CDN component
snice build-component <name> [--output=dir] [--format=iife] [--with-theme]

# Generators
npm run generate:react-adapters  # Generate React wrappers
npm run generate:react-tests     # Generate test files
```

## Test Commands

```bash
npm test                        # All tests
npm run test:src                # Source tests
npm run test:built              # Dist tests
npm run test:cdn                # CDN tests
npm run test:react-adapters     # React tests
npm run test:watch              # Watch mode
```

## File Structure

```
components/my-comp/
  snice-my-comp.ts              # Component class
  snice-my-comp.types.ts        # Interfaces & types (importable by controllers)
  snice-my-comp.css             # Styles

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

scripts/
  generate-react-adapters.js   # Adapter generator
  generate-react-tests.js      # Test generator
```

## Adding Components

1. Create `components/my-comp/snice-my-comp.ts`
2. Export from `src/index.ts`
3. Add metadata to `scripts/generate-react-adapters.js`
4. Add test config to `scripts/generate-react-tests.js`
5. Run generators:
   ```bash
   npm run generate:react-adapters
   npm run generate:react-tests
   ```
6. Create docs: `docs/my-comp.md` + `docs/ai/my-comp.md`
7. Build and test: `npm run build && npm test`

## CDN Builds

**Config:** `rollup.config.cdn.js`

All CDN builds use the shared runtime (external `snice` imports). Load `snice-runtime.min.js` once, then load component builds.

**Output:**
- Runtime: `dist/cdn/runtime/snice-runtime.min.js`
- Components: `dist/cdn/<name>/snice-<name>.min.js`
- IIFE: `.js` + `.min.js`
- Sourcemaps + README

**Size:** Runtime ~18KB gzip, components ~1-93KB each

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

**Generator:** `scripts/generate-react-adapters.js`

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

**Generator:** `scripts/generate-react-tests.js`

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
npm run release:dry   # Dry run
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
3. Regenerate if API changed
4. Run tests

**Debug tests:**
```bash
npm run test:watch           # Watch mode
npm run test:ui              # Vitest UI
npm run test:coverage        # Coverage report
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

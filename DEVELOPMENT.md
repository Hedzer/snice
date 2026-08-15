# Snice Framework Development Guide

Technical reference for developers working on the Snice framework itself. For building apps with Snice, see [README.md](./README.md).

## Table of Contents

- [Environment Setup](#environment-setup)
- [Architecture](#architecture)
- [Theme System](#theme-system)
- [Component Development](#component-development)
- [Build System](#build-system)
- [Testing](#testing)
- [CDN Builds](#cdn-builds)
- [React Adapters](#react-adapters)
- [Scripts Reference](#scripts-reference)
- [Code Organization](#code-organization)
- [Performance & Debugging](#performance--debugging)
- [Release Process](#release-process)
- [Contributing](#contributing)

---

## Environment Setup

### Requirements

- Node.js >= 18.0.0
- npm or compatible package manager

### Initial Setup

```bash
git clone git@gitlab.com:Hedzer/snice.git
cd snice
npm install
npm run build
npm test
```

### TypeScript Configuration

Snice uses **Stage 3 decorators** (not experimental decorators):

```json
{
  "experimentalDecorators": false,  // Stage 3 decorators
  "useDefineForClassFields": false, // Required for decorators
  "target": "ES2022",
  "module": "ESNext",
  "moduleResolution": "bundler"
}
```

**Multiple tsconfig files:**
- `tsconfig.json` - Shared root config for packages, examples, and tests
- `packages/core/tsconfig.json` - Framework distribution build
- `packages/components/tsconfig.json` - Component build
- `packages/react/tsconfig.json` - React integration build
- `adapters/react/tsconfig.json` - Published React adapter build

---

## Architecture

### Core Structure

```
packages/
├── core/src/           # Framework engine, decorators, router, renderer
├── components/src/     # Component implementations and stories
└── react/src/          # React provider/router integration

website/
├── public/             # Public website pages and assembled output
└── showcases/          # Card and full-showcase sources

examples/               # Standalone customer-readable applications
adapters/react/         # Published React adapter surface
bin/                    # Published CLI and create-app templates
tests/                  # Source, built, adapter, CDN, and browser suites
tooling/                # Build, generator, test, release, and website tools
```

### Decorator System

Metadata stored via **symbols** (not Reflect.metadata):

```typescript
// Internal implementation
const PROPERTIES = Symbol('properties');
const RENDER_METHOD = Symbol('renderMethod');

// Used by decorators
@element('my-element')
class MyElement {
  // Property metadata stored in class[PROPERTIES]
  @property() name = '';

  // Render method reference stored in class[RENDER_METHOD]
  @render() renderContent() { return html`...`; }
}
```

### Rendering Engine

**Differential updates** - only changed parts update:

1. Template compiled to `TemplateResult` with placeholders
2. First render creates DOM with `Part` instances at dynamic locations
3. Subsequent renders compare values, update only changed Parts
4. No virtual DOM, no full re-renders

**Part types:**
- `AttributePart` - Attribute values
- `BooleanAttributePart` - Boolean attributes (`?disabled`)
- `PropertyPart` - Element properties (`.value`)
- `EventPart` - Event listeners (`@click`)
- `NodePart` - Text content and child elements

---

## Theme System

### CSS Custom Properties

**Location:** `packages/components/src/theme/theme.css` (223 CSS variables)

**Format:** HSL values without `hsl()` wrapper

```css
:root {
  /* Primitives - HSL values (hue saturation% lightness%) */
  --snice-color-gray-500: 0 0% 45%;
  --snice-color-blue-600: 217 83% 53%;

  /* Semantic - Use hsl() wrapper */
  --snice-color-primary: hsl(var(--snice-color-blue-600));
  --snice-color-text: hsl(var(--snice-color-gray-900));
  --snice-color-surface: hsl(0 0% 100%);
}
```

### Color Scales

- **Gray:** 50-950 (11 shades)
- **Blue, Green, Red, Yellow:** 50-950 (11 shades each)
- **Semantic:** primary, success, warning, danger, neutral + hover states

### Design Tokens

**Spacing:**
```css
--snice-spacing-3xs: 0.125rem;  /* 2px */
--snice-spacing-2xs: 0.25rem;   /* 4px */
--snice-spacing-xs: 0.5rem;     /* 8px */
--snice-spacing-sm: 0.75rem;    /* 12px */
--snice-spacing-md: 1rem;       /* 16px */
--snice-spacing-lg: 1.5rem;     /* 24px */
--snice-spacing-xl: 2rem;       /* 32px */
--snice-spacing-2xl: 3rem;      /* 48px */
--snice-spacing-3xl: 4rem;      /* 64px */
```

**Typography:**
```css
--snice-font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';
--snice-font-family-mono: SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace;
--snice-font-size-xs: 0.75rem;   /* 12px */
--snice-font-size-sm: 0.875rem;  /* 14px */
--snice-font-size-md: 1rem;      /* 16px */
--snice-font-size-lg: 1.125rem;  /* 18px */
--snice-font-size-xl: 1.25rem;   /* 20px */
--snice-font-weight-normal: 400;
--snice-font-weight-medium: 500;
--snice-font-weight-bold: 700;
--snice-line-height-dense: 1.25;
--snice-line-height-normal: 1.5;
--snice-line-height-loose: 1.75;
```

**Borders & Shadows:**
```css
--snice-border-radius-sm: 0.125rem;  /* 2px */
--snice-border-radius-md: 0.25rem;   /* 4px */
--snice-border-radius-lg: 0.5rem;    /* 8px */
--snice-border-radius-xl: 1rem;      /* 16px */
--snice-border-radius-circle: 50%;
--snice-border-radius-pill: 9999px;

--snice-shadow-xs: 0 1px 3px 0 hsl(0 0% 0% / 0.04), 0 1px 2px 0 hsl(0 0% 0% / 0.06);
--snice-shadow-sm: 0 2px 6px 0 hsl(0 0% 0% / 0.04), 0 2px 4px -1px hsl(0 0% 0% / 0.06);
--snice-shadow-md: 0 4px 12px 0 hsl(0 0% 0% / 0.05), 0 2px 8px -2px hsl(0 0% 0% / 0.06);
--snice-shadow-lg: 0 10px 24px -3px hsl(0 0% 0% / 0.05), 0 4px 12px -4px hsl(0 0% 0% / 0.06);
--snice-shadow-xl: 0 20px 32px -5px hsl(0 0% 0% / 0.06), 0 8px 16px -6px hsl(0 0% 0% / 0.08);
--snice-shadow-2xl: 0 25px 50px -12px hsl(0 0% 0% / 0.12);
--snice-shadow-inset-sm: inset 0 1px 2px 0 hsl(0 0% 0% / 0.05);
--snice-shadow-inset-md: inset 0 2px 4px 0 hsl(0 0% 0% / 0.06);
```

**Z-index Layers:**
```css
--snice-z-floating: 1000;
--snice-z-sticky: 1020;
--snice-z-fixed: 1030;
--snice-z-scrim: 1040;
--snice-z-overlay: 1050;
--snice-z-popover: 1070;
```

### Dark Theme

Automatic theme switching via `prefers-color-scheme`:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --snice-color-text: hsl(var(--snice-color-gray-50));
    --snice-color-surface: hsl(var(--snice-color-gray-900));
    /* ... all semantic colors updated */
  }
}
```

### Component Theming Requirements

**Always use fallbacks:**

```css
/* ✓ Correct - with fallback */
color: var(--snice-color-text, hsl(0 0% 9%));

/* ✗ Wrong - no fallback */
color: var(--snice-color-text);
```

**Use semantic tokens, not primitives:**

```css
/* ✓ Correct - semantic */
background: var(--snice-color-surface, white);

/* ✗ Wrong - primitive */
background: var(--snice-color-gray-50, white);
```

**Prefer REM over pixels:**

```css
/* ✓ Correct */
padding: var(--snice-spacing-md, 1rem);

/* ✗ Wrong */
padding: 16px;
```

---

## Component Development

### File Structure

```
packages/components/src/my-component/
├── snice-my-component.ts       # Component implementation
├── snice-my-component.css      # Scoped styles
├── snice-my-component.types.ts # TypeScript interfaces (optional)
└── snice-my-component.stories.ts # Storybook scenarios

website/showcases/my-component/
├── card.html                   # Compact components-page example
└── full.html                   # Complete public feature showcase
```

### Component Template

```typescript
import { element, property, render, styles, html, css } from 'snice';
import cssContent from './snice-my-component.css?inline';

@element('snice-my-component')
export class SniceMyComponent extends HTMLElement {
  // Properties (reactive, sync with attributes)
  @property() variant: 'default' | 'primary' = 'default';
  @property({ type: Boolean }) disabled = false;
  @property({ type: Number }) count = 0;

  // Render method (auto re-renders on property changes)
  @render()
  renderContent() {
    return html`
      <div class="my-component" part="container">
        <slot></slot>
        <button
          ?disabled=${this.disabled}
          @click=${this.handleClick}
        >
          Count: ${this.count}
        </button>
      </div>
    `;
  }

  // Scoped styles (injected into shadow DOM)
  @styles()
  componentStyles() {
    return css`${cssContent}`;
  }

  // Event handler
  handleClick() {
    this.count++;
    // Property change triggers automatic re-render
  }
}
```

### CSS File Pattern

```css
/* snice-my-component.css */
:host {
  display: block;
  contain: layout style paint; /* Performance optimization */
}

.my-component {
  padding: var(--snice-spacing-md, 1rem);
  background: var(--snice-color-surface, white);
  color: var(--snice-color-text, black);
}

:host([variant="primary"]) .my-component {
  background: var(--snice-color-primary, hsl(217 83% 53%));
  color: var(--snice-color-text-inverse, white);
}
```

### Form-Associated Components

Components that participate in form submission:

```typescript
@element('snice-my-input', { formAssociated: true })
export class SniceMyInput extends HTMLElement {
  static formAssociated = true;
  private internals: ElementInternals;

  constructor() {
    super();
    this.internals = this.attachInternals();
  }

  @property()
  get value() { return this._value; }
  set value(v) {
    this._value = v;
    this.internals.setFormValue(v);
  }
  private _value = '';

  // Form lifecycle methods
  formResetCallback() { this.value = ''; }
  formDisabledCallback(disabled: boolean) { this.disabled = disabled; }
  formStateRestoreCallback(state: string) { this.value = state; }
}
```

### Performance Patterns

**CSS Containment:**
```css
:host {
  contain: layout style paint; /* Isolates layout calculations */
}
```

**Lazy Initialization:**
```typescript
@ready()
async initialize() {
  // Heavy initialization after render completes
  await this.loadData();
}
```

**Event Delegation:**
```typescript
@on('click', '.item')  // Delegates to .item children
handleItemClick(e: Event) { }
```

### TypeScript Interfaces

```typescript
// snice-my-component.types.ts
export interface MyComponentElement extends HTMLElement {
  variant: 'default' | 'primary';
  disabled: boolean;
  count: number;
}

export interface MyComponentEvent extends CustomEvent {
  detail: { count: number };
}
```

---

## Build System

### Rollup Configurations

**Core Build** (`rollup.config.js`):
- Builds `dist/index.{esm.js,cjs,iife.js}`
- Builds `dist/symbols.{esm.js,cjs}`
- Builds `dist/transitions.{esm.js,cjs}`
- Builds `dist/components/**/*.js` (preserves structure)
- External dependencies: none (fully bundled)
- TypeScript compilation via `@rollup/plugin-typescript`

**CDN Build** (`rollup.config.cdn.js`):
- Builds `dist/cdn/{component}/snice-{component}.{iife}.js`
- Uses shared runtime (external snice imports)
- IIFE format with minified versions
- Generates README per component

**Test Build** (`rollup.config.test.js`):
- Builds `dist/testing.esm.js`
- Test utilities for component testing

### CSS Processing

CSS files imported with `?inline` suffix:

```typescript
import cssContent from './my-component.css?inline';
```

Custom Rollup plugin inlines and minifies CSS:

```javascript
{
  name: 'css-loader',
  resolveId(id) {
    if (id.endsWith('.css?inline')) return id;
  },
  load(id) {
    if (id.endsWith('.css?inline')) {
      const css = fs.readFileSync(id.replace('?inline', ''), 'utf-8');
      const minified = new CleanCSS({ level: 2 }).minify(css).styles;
      return `export default ${JSON.stringify(minified)};`;
    }
  }
}
```

### Build Outputs

```
dist/
├── index.esm.js              # Core ESM build
├── index.cjs                 # Core CommonJS build
├── index.iife.js             # Core IIFE (browser)
├── index.d.ts                # TypeScript declarations
├── symbols.{esm.js,cjs}      # Symbol exports
├── transitions.{esm.js,cjs}  # Transition utilities
├── components/               # Individual components
│   ├── button/snice-button.js
│   ├── input/snice-input.js
│   └── ...
└── cdn/                      # CDN bundles
    ├── runtime/
    │   ├── snice-runtime.min.js
    │   └── README.md
    ├── button/
    │   ├── snice-button.js      # IIFE
    │   ├── snice-button.min.js  # IIFE minified
    │   └── README.md
    └── ...
```

---

## Testing

### Vitest Configuration

**File:** `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import swc from 'unplugin-swc';

export default defineConfig({
  plugins: [
    swc.vite({
      jsc: {
        parser: { syntax: 'typescript', decorators: true },
        target: 'es2022',
        transform: {
          decoratorMetadata: false,
          decoratorVersion: '2022-03',    // Stage 3 decorators
          useDefineForClassFields: false  // Required
        }
      }
    })
  ],
  test: {
    environment: 'happy-dom',      // DOM simulation
    globals: true,                 // describe, it, expect globally
    exclude: [
      'node_modules', 'dist', 'examples',
      'tests/live',               // Playwright tests
      '.debug'                    // Temporary debug files
    ]
  }
});
```

### Test Structure

```
tests/
├── components/                    # Component API tests
│   ├── button.test.ts
│   ├── input.test.ts
│   └── ...
├── react-adapters/               # React wrapper tests
│   ├── index.test.tsx            # Infrastructure
│   ├── test-helpers.tsx          # Reusable utilities
│   └── components/               # Per-component tests
│       ├── button.test.tsx
│       ├── input.test.tsx
│       └── ...
├── cdn-builds.test.ts            # CDN build verification
├── channel.test.ts               # Core feature tests
├── decorators.test.ts
├── dispatch.test.ts
├── form-associated.test.ts
└── router.test.ts
```

### Component Test Pattern

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import SniceButton from '../../packages/components/src/button/snice-button';
import { trackRenders } from 'snice';

describe('snice-button', () => {
  let element: SniceButton;

  beforeEach(() => {
    element = document.createElement('snice-button') as SniceButton;
    document.body.appendChild(element);
  });

  afterEach(() => {
    element.remove();
  });

  it('should have default variant', () => {
    expect(element.variant).toBe('default');
  });

  it('should update on property change', async () => {
    element.variant = 'primary';
    const tracker = trackRenders(element);
    await tracker.next();  // Wait for render
    expect(element.shadowRoot?.querySelector('.button')?.classList.contains('primary')).toBe(true);
  });

  it('should dispatch custom events', () => {
    const handler = vi.fn();
    element.addEventListener('button-click', handler);
    element.shadowRoot?.querySelector('button')?.click();
    expect(handler).toHaveBeenCalled();
  });
});
```

### React Adapter Test Pattern

```typescript
import { describe, it, expect, vi } from 'vitest';
import { testComponent } from '../test-helpers';
import { Button } from '../../../adapters/react/button';

testComponent({
  name: 'Button',
  Component: Button,
  properties: [
    { name: 'variant', value: 'primary' },
    { name: 'disabled', value: true }
  ],
  events: [
    { name: 'onClick' }
  ],
  variants: ['default', 'primary', 'secondary'],
  sizes: ['small', 'medium', 'large']
});
```

### Test Commands

```bash
npm test                       # Complete required gate (source+built+browser+site)
npm run test:source            # Test package source files
npm run test:matrix            # Table feature-combination matrix (opt-in fuzz tier)
npm run test:distribution      # Fresh build, then test dist/ output
npm run test:cdn               # Fresh CDN build + artifact/runtime tests
npm run test:react             # Fresh adapters + React tests
npm run test:watch             # Watch mode
npm run test:ui                # Vitest UI
npm run test:coverage          # Generate a general coverage report
npm run test:coverage:core     # Enforce >90% for every core-engine metric
npm run test:browsers:install  # Install Chromium, Firefox, and WebKit
npm run test:browser:framework # Required framework/table E2E in all three engines
npm run test:browser:website   # Generated deployment E2E in all three engines
npm run test:browser           # Both browser gates
npm run gauntlet               # Blind local-model checker gauntlet
```

`npm test` runs source and built-distribution suites, CDN and React checks, the
strict core-engine coverage gate, the built customer scenarios, and the
generated public website in Chromium, Firefox, and WebKit. The browser runners
manage their own local servers. The coverage scope is the rendering engine:
`element.ts`, `parts.ts`, `reactive.ts`, `render-root.ts`, `render.ts`,
`repeat.ts`, `snice-element.ts`, and `template.ts`; aggregate statements,
branches, functions, and lines must each be strictly greater than 90%.

### Test Tiers

Not every suite belongs in the loop you run after every keystroke. There are
three tiers, and the difference between them is who asks for them.

| Tier | Command | Cost | When to run it |
|------|---------|------|----------------|
| Everyday | `vitest run`, `npm run test:source` | ~26s for `tests/components` | Every change |
| Matrix (fuzz) | `npm run test:matrix` | ~100s across 52 files | Any change to table rendering — and once inside `npm test` |
| Visual | Playwright (`tests/live`, `npm run test:browser`) | Slowest | When asked for, and in the full gate |

**The everyday tier is deliberately screenshot-free and matrix-free.** The table
feature-combination matrix in `tests/components/table-matrix/` crosses every
table feature against every other one and asserts exact rendered output. It is
worth its ~102s when you have touched the table, and it is pure tax when you
have not — so `vitest.config.ts` excludes the directory from the default
include, exactly the way `tests/live` is excluded. Plain `vitest run` and
`npm run test:source` no longer pay for it.

**Running the matrix is an explicit act:**

```bash
npm run test:matrix     # all 52 matrix files
```

That script points Vitest at `vitest.matrix.config.ts`, which inherits
everything from `vitest.config.ts` and then replaces the `exclude` list with the
base list minus the matrix directory. (Replaces, not merges: Vitest's
`mergeConfig` concatenates arrays, so an inherited `exclude` would still contain
the entry that hides the suite.) The config fails loudly if the base config ever
stops excluding the directory, so the matrix cannot silently end up running
twice.

**The everyday loop still gets a taste.**
`tests/components/table-matrix-smoke.test.ts` lives outside the excluded
directory, so it stays in the default include. It runs one combo per slice
family — columns, delivery, editing, filtering, grouping, height-fill,
pagination, selection, sorting, tree-detail, typed-cells, virtualization —
rotated across `{local, remote} x {valueGetter, formatter}` so all four cells
are covered, plus the marquee regressions the matrix exists to pin (in-place
mutation repaint, same-reference re-render, sort-on-delivery, the empty and
loading states, and the virtualizer's paint commit). Its budget is roughly four
seconds. It is a smoke test, not a substitute: new combinations belong in the
matrix, not in the smoke file.

Excluding the directory removes its files from test *collection* only, not from
module resolution — the smoke file imports `matrix-utils` and the per-slice
`*-support.ts` helpers straight out of `tests/components/table-matrix/` and
asserts through the matrix's own oracles.

In the full gate, the matrix runs as its own `table matrix suite` stage exactly
once, next to the source suite rather than per artifact flavour; see the comment
in `tooling/testing/run-full-tests.js` for why.

### Dumb-Agent Checker Gauntlet

Maintainers can run small local models as blind Snice builders to find checker
gaps. The command downloads and verifies its pinned llama.cpp runtime and GGUF
models automatically, then preserves each raw response plus checker,
TypeScript, and production-build logs under the ignored `.local/` tree.

```bash
npm run gauntlet                              # complete application sample, all models
npm run gauntlet -- --sample events
npm run gauntlet -- --sample router
npm run gauntlet -- --prompt "Build a Snice application ..."
npm run gauntlet -- --prompt-file ./prompt.txt
npm run gauntlet -- --models qwen3-0.6b,lfm2.5-350m
```

See [`.ai/testing.md`](./.ai/testing.md) for artifact verification,
scheduling, samples, output layout, and the required false-positive/
false-negative classification loop.

---

## CDN Builds

### Purpose

Bundle any component with the Snice runtime for use without npm install:

- Works in any project (vanilla JS, React, Vue, etc.)
- No Snice dependency required
- Runtime ~34KB gzip, components ~1-119KB each
- IIFE format for script tags

### CLI Usage

```bash
# Build single component
snice build-component button

# With options
snice build-component button \
  --output=./cdn \
  --format=iife \
  --minify \
  --with-theme

# Build all components
npm run build:cdn
```

### Implementation

**Key file:** `rollup.config.cdn.js`

```javascript
export function createCdnBuild(componentName, options) {
  return {
    input: `dist/components/${componentName}/snice-${componentName}.js`,
    external: ['snice', 'snice/symbols', 'snice/transitions'],
    plugins: [
      resolve({ /* ... */ }),
      // CSS inlining plugin
      // README generation plugin
    ],
    output: [
      { file: `dist/cdn/${componentName}/snice-${componentName}.js`, format: 'iife' }
    ]
  };
}
```

### Usage Example

```html
<!-- Direct browser usage -->
<script src="snice-button.min.js"></script>
<snice-button variant="primary">Click me</snice-button>

<!-- ES Module -->
<script type="module">
  import './snice-button.esm.js';
  const btn = document.createElement('snice-button');
  btn.variant = 'primary';
  document.body.appendChild(btn);
</script>
```

---

## React Adapters

### Generation System

**Generator:** `tooling/generators/generate-react-adapters.js`

Scans components, extracts metadata, generates React wrappers:

```javascript
// Component metadata
const componentMetadata = {
  'button': {
    properties: ['variant', 'size', 'disabled', 'loading'],
    events: { 'button-click': 'onClick' },
    isFormAssociated: false
  }
};

// Generates: adapters/react/button.tsx
```

### Generated Adapter Structure

```tsx
// adapters/react/button.tsx (auto-generated)
import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

export interface ButtonProps extends SniceBaseProps {
  variant?: 'default' | 'primary';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  onClick?: (event: CustomEvent) => void;
}

export const Button = createReactAdapter<ButtonProps>({
  tagName: 'snice-button',
  properties: ['variant', 'size', 'disabled', 'loading'],
  events: { 'button-click': 'onClick' },
  formAssociated: false
});
```

### Adapter Core

**File:** `adapters/react/wrapper.tsx`

```typescript
export function createReactAdapter<P>(config: AdapterConfig) {
  const { tagName, properties, events, formAssociated } = config;

  const Component = forwardRef<any, P>((props, ref) => {
    const elementRef = useRef<HTMLElement>(null);

    // Set properties on element
    useEffect(() => {
      properties.forEach(prop => {
        if (props[prop] !== undefined) {
          elementRef.current[prop] = props[prop];
        }
      });
    }, [props]);

    // Attach event listeners
    useEffect(() => {
      Object.entries(events).forEach(([eventName, callbackProp]) => {
        const handler = props[callbackProp];
        if (handler) {
          elementRef.current?.addEventListener(eventName, handler);
          return () => elementRef.current?.removeEventListener(eventName, handler);
        }
      });
    }, [props]);

    // Expose methods via ref
    useImperativeHandle(ref, () => elementRef.current, []);

    return React.createElement(tagName, { ref: elementRef }, props.children);
  });

  Component.displayName = `Snice(${tagName})`;
  return Component;
}
```

### Usage Example

```tsx
import { Button, Input } from 'snice/react';

function MyForm() {
  const [value, setValue] = useState('');
  const buttonRef = useRef();

  return (
    <form>
      <Input
        value={value}
        onInputInput={(e) => setValue(e.detail.value)}
        placeholder="Enter text"
      />
      <Button
        ref={buttonRef}
        variant="primary"
        disabled={!value}
        onClick={() => console.log('Clicked!')}
      >
        Submit
      </Button>
    </form>
  );
}
```

### Building Adapters

```bash
# Generate .tsx files
npm run generate:react-adapters

# Compile to .js
npm run build:react

# Or build everything
npm run build
```

---

## Scripts Reference

### Build Scripts

```bash
npm run sync:versions          # Sync template and website versions
npm run build                  # Build everything
npm run build:distribution     # Build dist/ (core + components + React runtime)
npm run build:types            # Generate .d.ts files
npm run build:cdn              # Build all CDN bundles
npm run build:react            # Generate + build React adapters
npm run build:testing          # Build the source/built test bridge
npm run build:website          # Assemble public website and showcases
npm run build:website:full     # Build CDN assets and website
```

### Test Scripts

```bash
npm test                       # Complete source+built+coverage+browser+site gate
npm run test:source            # Test package source files
npm run test:matrix            # Table feature-combination matrix (opt-in fuzz tier)
npm run test:distribution      # Build and test dist/ output
npm run test:cdn               # Test CDN bundles
npm run test:react             # Test React wrappers
npm run test:watch             # Watch mode
npm run test:ui                # Vitest UI
npm run test:coverage          # General coverage report
npm run test:coverage:core     # Enforced core-engine coverage
npm run test:browsers:install  # Install Chromium, Firefox, and WebKit
npm run test:browser:framework # Required framework/table browser scenarios
npm run test:browser:website   # Generated-site browser scenarios
npm run test:browser           # Both browser gates
```

### Generator Scripts

```bash
npm run generate:react-adapters  # Generate React .tsx files
npm run generate:react-tests     # Generate React test files
```

### Development Scripts

```bash
npm run dev                    # Dev orchestration (framework: 5566, website: 52891)
npm run dev:framework          # Framework/showcase Vite server only
npm run dev:website            # Generated public website Vite server only
npm run dev:storybook          # Storybook
npm run preview                # Preview production build
```

### Release Scripts

```bash
npm run release                # Create release (semantic-release)
npm run release:dry-run        # Dry run
```

---

## Code Organization

### Directory Structure

```
snice/
├── .ai/                       # AI development guides
├── adapters/                  # Published adapter surface
│   └── react/                 # React wrappers
│       ├── wrapper.tsx        # Core adapter logic
│       ├── types.ts           # TypeScript definitions
│       ├── utils.ts           # Utilities
│       ├── button.tsx         # Generated adapters
│       └── ...
├── bin/                       # CLI tools
│   ├── snice.js               # CLI entry point
│   └── templates/             # create-app templates
├── dist/                      # Build output (gitignored)
├── docs/                      # User documentation
│   ├── ai/                    # Token-efficient AI docs
│   └── components/            # Component docs
├── examples/                  # Standalone example applications
├── packages/
│   ├── core/src/              # Framework engine
│   ├── components/src/        # Component library and stories
│   └── react/src/             # React provider/router integration
├── tests/                     # Test suites
│   ├── components/            # Component tests
│   ├── react-adapters/        # React adapter tests
│   └── *.test.ts              # Core tests
├── tooling/                   # Build/generator/test/website/release tools
├── website/
│   ├── public/                # Public website
│   └── showcases/             # Card and full-showcase sources
├── CLAUDE.md                  # AI assistant instructions
├── DEVELOPMENT.md             # This file
└── README.md                  # User-facing docs
```

### Naming Conventions

**Components:**
- Element: `snice-{name}` (e.g., `snice-button`)
- File: `snice-{name}.ts`
- Class: `Snice{Name}` (e.g., `SniceButton`)
- CSS: `snice-{name}.css`
- Types: `snice-{name}.types.ts`

**Files:**
- TypeScript: `.ts` for code, `.d.ts` for declarations
- Tests: `.test.ts` or `.test.tsx`
- Configs: `*.config.js` or `*.config.ts`

---

## Performance & Debugging

### Performance Optimization

**CSS Containment:**
```css
:host {
  /* Isolates layout, style, and paint calculations */
  contain: layout style paint;
}
```

**Differential Rendering:**
- Framework only updates changed Parts
- No virtual DOM overhead
- Property changes trigger selective updates

**Event Delegation:**
```typescript
@on('click', '.item')  // Single listener for all .item elements
handleClick(e: Event) { }
```

**Lazy Initialization:**
```typescript
@ready()
async loadData() {
  // Heavy work after render
}
```

**Memory Management:**
```typescript
@dispose()
cleanup() {
  // Remove listeners, clear timers, release references
  this.observer?.disconnect();
  clearInterval(this.intervalId);
}
```

### Debugging Techniques

**Element Inspection:**
```javascript
// In browser console
const el = document.querySelector('snice-button');
el.shadowRoot;           // Shadow DOM
el.variant;              // Property access
el.getAttribute('variant'); // Attribute access
```

**Render Debugging:**
```typescript
// Enable render tracking
import { trackRenders } from 'snice';

const tracker = trackRenders(element);
await tracker.next(); // Wait for next render
```

**Test Debugging:**
```bash
npm run test:ui          # Vitest UI
npm run test:watch       # Watch mode with auto-rerun
```

**Playwright Debugging:**
```bash
# Keep project debugging headless; use logs, locators, and page errors.
npx playwright test path/to/test.spec.ts --config=tests/playwright.config.ts --project=chromium
```

**Build Debugging:**
```bash
# Check bundle size
ls -lh dist/cdn/button/
du -sh dist/

# Analyze bundle contents
npx rollup-plugin-visualizer dist/cdn/button/snice-button.min.js
```

---

## Release Process

### Semantic Versioning

Releases use **semantic-release** with conventional commits:

```
feat: New feature          → Minor version (1.2.0 → 1.3.0)
fix: Bug fix               → Patch version (1.2.0 → 1.2.1)
BREAKING CHANGE: in body   → Major version (1.2.0 → 2.0.0)
```

### Conventional Commits

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation only
- `style:` - Code style (formatting, semicolons)
- `refactor:` - Code refactoring
- `perf:` - Performance improvement
- `test:` - Adding tests
- `chore:` - Build process, tooling

**Examples:**
```
feat(button): add loading state
fix(input): handle null value properly
docs: update theme system guide
chore: update dependencies

BREAKING CHANGE: Removed deprecated @part decorator
```

### Release Workflow

```bash
# 1. Commit changes
git add .
git commit -m "feat: add new component"

# 2. Push to main
git push origin main

# 3. Run release (automated via semantic-release)
npm run release

# Or dry run to preview
npm run release:dry-run
```

### What Happens During Release

1. Analyzes commits since last release
2. Determines version bump
3. Updates package.json version
4. Generates CHANGELOG.md
5. Creates git tag
6. Pushes tag to GitLab
7. Publishes to npm

**Configuration:** `.releaserc.json`

---

## Contributing

### Workflow

1. **Fork & Clone**
   ```bash
   git clone git@gitlab.com:Hedzer/snice.git
   cd snice
   npm install
   ```

2. **Create Feature Branch**
   ```bash
   git checkout -b feature/my-feature
   ```

3. **Make Changes**
   - Follow code style
   - Add tests
   - Update docs (both versions)

4. **Test**
   ```bash
   npm run build
   npm test
   ```

5. **Commit**
   ```bash
   git commit -m "feat: add my feature"
   ```

6. **Push & Create MR**
   ```bash
   git push origin feature/my-feature
   ```

### Adding a New Component

1. **Create Component Files**
   ```
   packages/components/src/my-component/
   ├── snice-my-component.ts
   ├── snice-my-component.css
   ├── snice-my-component.types.ts
   └── snice-my-component.stories.ts
   ```

2. **Implement Component**
   - Use standard decorators
   - Follow theme system
   - Add proper types

3. **Add Adapter Metadata When Needed**
   ```javascript
   // tooling/generators/generate-react-adapters.js
   const componentMetadata = {
     'my-component': {
       properties: ['prop1', 'prop2'],
       events: { 'my-event': 'onMyEvent' }
     }
   };
   ```

4. **Add Test Config**
   ```javascript
   // tooling/generators/generate-react-tests.js
   const componentTestConfig = {
     'my-component': {
       properties: ['prop1', 'prop2'],
       events: ['onMyEvent']
     }
   };
   ```

5. **Create Public Showcases**
   - `website/showcases/my-component/card.html`
   - `website/showcases/my-component/full.html`
   - Add the card to `website/showcases/shared/manifest.json`

6. **Generate & Build**
   ```bash
   npm run generate:react-adapters
   npm run generate:react-tests
   npm run build
   npm test
   ```

7. **Create Documentation**
   - `docs/components/my-component.md` (detailed)
   - `docs/ai/components/my-component.md` (concise)

### Code Style

- **TypeScript:** Strict mode enabled
- **Naming:** camelCase for variables/methods, PascalCase for classes
- **Formatting:** 2 spaces, single quotes
- **Comments:** JSDoc for public APIs
- **Decorators:** Use stage 3 syntax
- **Async:** Prefer async/await over promises

### Documentation Requirements

**Always update BOTH versions:**
- `docs/*.md` - Detailed, user-friendly
- `docs/ai/*.md` - Concise, token-efficient

**Format for AI docs:**
- Type signatures over prose
- Bullet points over paragraphs
- Code over explanations
- No tutorials

---

## Troubleshooting

### Build Failures

**TypeScript errors:**
```bash
# Check tsconfig
tsc --noEmit

# Verify decorator settings
grep -r "experimentalDecorators" tsconfig*.json
# Should be false (stage 3 decorators)
```

**Standalone build fails:**
```bash
# Check component exists
ls packages/components/src/my-component/snice-my-component.ts

# Test config directly
node rollup.config.cdn.js
```

### Test Failures

**React adapter tests fail:**
```bash
# Ensure React installed
npm list react

# Rebuild adapters
npm run generate:react-adapters
npm run build:react
```

**Component tests fail:**
```bash
# Check environment
npm run test:source -- --reporter=verbose

# Debug single test
npm run test:watch -- tests/components/button.test.ts
```

### Runtime Issues

**Component not registered:**
```javascript
// Check registration
console.log(customElements.get('snice-button'));

// Force registration
import './packages/components/src/button/snice-button';
```

**Styles not applied:**
```javascript
// Check shadow DOM
const el = document.querySelector('snice-button');
console.log(el.shadowRoot.adoptedStyleSheets);
```

---

## Additional Resources

- **User Docs:** [README.md](./README.md)
- **API Reference:** [docs/ai/api.md](./docs/ai/api.md)
- **Architecture:** [docs/ai/architecture.md](./docs/ai/architecture.md)
- **Example App:** [examples/app/](./examples/app/)
- **Issues:** https://gitlab.com/Hedzer/snice/-/issues

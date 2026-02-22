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
- `tsconfig.json` - Root config for src/, examples/, tests/
- `tsconfig.src.json` - Src-specific config for core builds
- `components/tsconfig.json` - Component builds
- `adapters/react/tsconfig.json` - React adapter builds

---

## Architecture

### Core Structure

```
src/                    # Framework core
├── element.ts          # @element, @layout decorators, element lifecycle
├── controller.ts       # @controller decorator, behavior modules
├── render.ts           # Differential rendering engine
├── template.ts         # Template compilation (html``, css``)
├── parts.ts            # DOM part system for updates
├── router.ts           # SPA routing
├── symbols.ts          # Metadata storage via symbols
└── ...

components/             # Component implementations
adapters/react/         # React adapter system
tests/                  # Test suites
scripts/                # Build automation
bin/                    # CLI tools
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

**Location:** `components/theme/theme.css` (184 CSS variables)

**Format:** HSL values without `hsl()` wrapper

```css
:root {
  /* Primitives - HSL values (hue saturation% lightness%) */
  --snice-color-gray-500: 0 0% 45%;
  --snice-color-blue-600: 217 83% 53%;

  /* Semantic - Use hsl() wrapper */
  --snice-color-primary: hsl(var(--snice-color-blue-600));
  --snice-color-text: hsl(var(--snice-color-gray-900));
  --snice-color-background: hsl(0 0% 100%);
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
--snice-font-family-sans: system-ui, -apple-system, sans-serif;
--snice-font-family-mono: 'Courier New', Courier, monospace;
--snice-font-size-xs: 0.75rem;   /* 12px */
--snice-font-size-sm: 0.875rem;  /* 14px */
--snice-font-size-md: 1rem;      /* 16px */
--snice-font-size-lg: 1.125rem;  /* 18px */
--snice-font-size-xl: 1.25rem;   /* 20px */
--snice-font-weight-normal: 400;
--snice-font-weight-medium: 500;
--snice-font-weight-bold: 700;
--snice-line-height-tight: 1.25;
--snice-line-height-normal: 1.5;
--snice-line-height-relaxed: 1.75;
```

**Borders & Shadows:**
```css
--snice-border-radius-sm: 0.25rem;  /* 4px */
--snice-border-radius-md: 0.375rem; /* 6px */
--snice-border-radius-lg: 0.5rem;   /* 8px */
--snice-border-radius-xl: 0.75rem;  /* 12px */
--snice-border-radius-full: 9999px;

--snice-shadow-sm: 0 1px 2px 0 hsl(0 0% 0% / 0.05);
--snice-shadow-md: 0 4px 6px -1px hsl(0 0% 0% / 0.1);
--snice-shadow-lg: 0 10px 15px -3px hsl(0 0% 0% / 0.1);
--snice-shadow-xl: 0 20px 25px -5px hsl(0 0% 0% / 0.1);
```

**Z-index Layers:**
```css
--snice-z-index-base: 0;
--snice-z-index-dropdown: 1000;
--snice-z-index-sticky: 1020;
--snice-z-index-fixed: 1030;
--snice-z-index-modal-backdrop: 1040;
--snice-z-index-modal: 1050;
--snice-z-index-popover: 1060;
--snice-z-index-tooltip: 1070;
```

### Dark Theme

Automatic theme switching via `prefers-color-scheme`:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --snice-color-text: hsl(var(--snice-color-gray-50));
    --snice-color-background: hsl(var(--snice-color-gray-900));
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
background: var(--snice-color-background, white);

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
components/my-component/
├── snice-my-component.ts       # Component implementation
├── snice-my-component.css      # Scoped styles
├── snice-my-component.types.ts # TypeScript interfaces (optional)
└── demo.html                   # Visual demo/documentation
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
  background: var(--snice-color-background, white);
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
import { SniceButton } from '../components/button/snice-button';

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
    await element.updateComplete;  // Wait for render
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
npm test                       # All tests
npm run test:src               # Test source files
npm run test:built             # Test dist/ output
npm run test:cdn               # Test CDN bundles
npm run test:react-adapters    # Test React wrappers
npm run test:watch             # Watch mode
npm run test:ui                # Vitest UI
npm run test:coverage          # Generate coverage report
```

---

## CDN Builds

### Purpose

Bundle any component with the Snice runtime for use without npm install:

- Works in any project (vanilla JS, React, Vue, etc.)
- No Snice dependency required
- Runtime ~18KB gzip, components ~1-27KB each
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

**Generator:** `scripts/generate-react-adapters.js`

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
    useLayoutEffect(() => {
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
        onChange={(e) => setValue(e.detail.value)}
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
npm run sync-versions          # Sync template package.json versions
npm run build                  # Build everything
npm run build:core             # Build dist/ (core + components)
npm run build:types            # Generate .d.ts files
npm run build:cdn              # Build all CDN bundles
npm run build:react            # Generate + build React adapters
npm run build:test             # Build test utilities
```

### Test Scripts

```bash
npm test                       # Run all test suites
npm run test:src               # Test source files
npm run test:built             # Test dist/ output
npm run test:cdn               # Test CDN bundles
npm run test:react-adapters    # Test React wrappers
npm run test:watch             # Watch mode
npm run test:ui                # Vitest UI
npm run test:coverage          # Coverage report
```

### Generator Scripts

```bash
npm run generate:react-adapters  # Generate React .tsx files
npm run generate:react-tests     # Generate React test files
```

### Development Scripts

```bash
npm run dev                    # Vite dev server (port 5173)
npm run preview                # Preview production build
```

### Release Scripts

```bash
npm run release                # Create release (semantic-release)
npm run release:dry            # Dry run
```

---

## Code Organization

### Directory Structure

```
snice/
├── .ai/                       # AI development guides
├── adapters/                  # Framework adapters
│   └── react/                 # React wrappers
│       ├── wrapper.tsx        # Core adapter logic
│       ├── types.ts           # TypeScript definitions
│       ├── utils.ts           # Utilities
│       ├── button.tsx         # Generated adapters
│       └── ...
├── bin/                       # CLI tools
│   ├── snice.js               # CLI entry point
│   └── templates/             # create-app templates
├── components/                # Component library
│   ├── button/
│   │   ├── snice-button.ts
│   │   ├── snice-button.css
│   │   └── demo.html
│   └── theme/
│       └── theme.css          # Design tokens
├── dist/                      # Build output (gitignored)
├── docs/                      # User documentation
│   ├── ai/                    # Token-efficient AI docs
│   └── components/            # Component docs
├── examples/                  # Example apps
│   └── app/                   # Todo app example
├── scripts/                   # Build automation
│   ├── generate-react-adapters.js
│   ├── generate-react-tests.js
│   └── sync-template-versions.js
├── src/                       # Framework core
│   ├── element.ts             # Element & layout system
│   ├── controller.ts          # Controller system
│   ├── render.ts              # Rendering engine
│   ├── template.ts            # Template compiler
│   ├── parts.ts               # Part system
│   ├── router.ts              # Router
│   ├── symbols.ts             # Metadata symbols
│   └── ...
├── tests/                     # Test suites
│   ├── components/            # Component tests
│   ├── react-adapters/        # React adapter tests
│   └── *.test.ts              # Core tests
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
import { RenderTracker } from 'snice/testing';

const tracker = new RenderTracker(element);
tracker.renders; // Number of renders
tracker.lastRender; // Timestamp
```

**Test Debugging:**
```bash
npm run test:ui          # Vitest UI
npm run test:watch       # Watch mode with auto-rerun
```

**Playwright Debugging:**
```bash
# Run with UI (see .ai/PLAYWRIGHT_TESTING_GUIDE.md)
npx playwright test --ui
npx playwright test --headed
npx playwright test --debug
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
npm run release:dry
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
   components/my-component/
   ├── snice-my-component.ts
   ├── snice-my-component.css
   └── demo.html
   ```

2. **Implement Component**
   - Use standard decorators
   - Follow theme system
   - Add proper types

3. **Export from Core**
   ```typescript
   // src/index.ts
   export { SniceMyComponent } from '../components/my-component/snice-my-component';
   ```

4. **Add Adapter Metadata**
   ```javascript
   // scripts/generate-react-adapters.js
   const componentMetadata = {
     'my-component': {
       properties: ['prop1', 'prop2'],
       events: { 'my-event': 'onMyEvent' }
     }
   };
   ```

5. **Add Test Config**
   ```javascript
   // scripts/generate-react-tests.js
   const componentTestConfig = {
     'my-component': {
       properties: ['prop1', 'prop2'],
       events: ['onMyEvent']
     }
   };
   ```

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
ls components/my-component/snice-my-component.ts

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
npm run test:src -- --reporter=verbose

# Debug single test
npm run test:watch -- components/button.test.ts
```

### Runtime Issues

**Component not registered:**
```javascript
// Check registration
console.log(customElements.get('snice-button'));

// Force registration
import { SniceButton } from './components/button/snice-button';
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

<!-- AI: For the AI-optimized version of this doc, see docs/ai/STORYBOOK.md -->
# Storybook

Storybook provides an interactive component explorer for Snice components. Each component has its own story file that documents its variants, sizes, and states.

## Getting Started

```bash
# Start the development server
npm run storybook
# Open http://localhost:6006

# Build a static version
npm run build-storybook
```

The `prestorybook` script ensures `dist/index.esm.js` exists (runs `npm run build:core` if not).

## How It Works

Storybook uses the `@storybook/web-components-vite` framework. Stories mount Snice components as standard HTML custom elements — no framework adapter needed.

The SWC plugin (`unplugin-swc`) is injected via `viteFinal` in `.storybook/main.ts` to handle TC39 Stage 3 decorators (`decoratorVersion: '2022-03'`). This matches the existing Vite/Vitest config.

### Theme

The Snice theme CSS is loaded from `dist/components/theme/theme.css` (served at `/snice-components/theme/theme.css`). A toolbar button in Storybook lets you toggle between `dark` and `light` themes.

## Where Stories Live

```
components/<name>/snice-<name>.stories.ts
```

For example:
- `components/button/snice-button.stories.ts`
- `components/input/snice-input.stories.ts`

## Adding a Story

### 1. Create the story file

```ts
// components/my-comp/snice-my-comp.stories.ts
import type { Meta, StoryObj } from '@storybook/web-components-vite';
import './snice-my-comp';
import type { MyCompVariant, MyCompSize } from './snice-my-comp.types';

type Args = {
  variant?: MyCompVariant;
  size?: MyCompSize;
  disabled?: boolean;
  label?: string;
};

const VARIANTS: MyCompVariant[] = ['default', 'primary', 'secondary'];
const SIZES: MyCompSize[] = ['small', 'medium', 'large'];

const meta: Meta<Args> = {
  title: 'Category/MyComp',   // Use the appropriate category
  component: 'snice-my-comp',
  tags: ['autodocs'],          // Enables auto-generated docs page
  argTypes: {
    variant:  { control: 'select', options: VARIANTS },
    size:     { control: 'select', options: SIZES },
    disabled: { control: 'boolean' },
    label:    { control: 'text' },
  },
  render: (args) => {
    const el = document.createElement('snice-my-comp');
    // String attributes
    if (args.variant !== undefined) el.setAttribute('variant', String(args.variant));
    if (args.size    !== undefined) el.setAttribute('size',    String(args.size));
    // Boolean attributes — only set when true
    if (args.disabled) el.toggleAttribute('disabled', true);
    // Text content
    el.textContent = args.label ?? 'Default';
    return el;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {
  args: { variant: 'default', size: 'medium', label: 'Default' },
};

export const Primary: Story = {
  args: { ...Default.args, variant: 'primary', label: 'Primary' },
};

export const AllVariants: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:.75rem;flex-wrap:wrap;align-items:center;';
    for (const variant of VARIANTS) {
      const el = document.createElement('snice-my-comp');
      el.setAttribute('variant', variant);
      el.textContent = variant;
      wrap.appendChild(el);
    }
    return wrap;
  },
};
```

### 2. Story naming convention

- Always export `Default` and `AllVariants`
- Add named stories for each significant showcase section
- Use PascalCase for story names: `WithLabel`, `AllSizes`, `Disabled`, `Loading`

### 3. Property types

| Property type | How to set in render |
|--------------|----------------------|
| String attribute | `el.setAttribute('foo', String(args.foo))` |
| Boolean attribute | `el.toggleAttribute('foo', true)` |
| Object / Array | `(el as any).foo = args.foo` |
| Kebab-case attribute | `el.setAttribute('my-attr', value)` |

### 4. Events

```ts
el.addEventListener('my-event', (e: Event) => {
  const detail = (e as CustomEvent).detail;
  console.log(detail.value);
});
```

## Snice Is NOT Lit

Snice components are plain standard custom elements. Do NOT:
- Import from `lit`, `lit-html`, or `lit-element`
- Import `html` from `'snice'` in stories (that is Snice's internal template engine)
- Extend `LitElement`

Instead, use `document.createElement('snice-...')` and standard DOM APIs.

## SWC / Decorator Configuration

The `.storybook/main.ts` uses `viteFinal` to inject `unplugin-swc` with:

```ts
{
  jsc: {
    parser: { syntax: 'typescript', decorators: true },
    target: 'es2022',
    transform: {
      decoratorMetadata: false,
      decoratorVersion: '2022-03',
      useDefineForClassFields: false,
    },
  },
}
```

This matches `vite.config.ts` and `vitest.config.ts`. Never set `experimentalDecorators: true`.

## File Structure

```
.storybook/
  main.ts          # Framework config, SWC plugin, static dirs
  preview.ts       # Global decorators, theme, backgrounds
  tsconfig.json    # Extends root tsconfig, includes stories

components/
  button/
    snice-button.ts
    snice-button.types.ts
    snice-button.css
    snice-button.stories.ts   ← story file lives here

docs/
  STORYBOOK.md               ← this file
  ai/STORYBOOK.md            ← token-efficient AI reference
```

# Storybook (AI Reference)

## Commands
```bash
npm run dev:storybook      # Dev server on :6006
npm run build:storybook    # Static build → storybook-static/
```

`predev:storybook` runs `npm run build:distribution` if `dist/index.esm.js` is missing.

## Story locations
`packages/components/src/<name>/snice-<name>.stories.ts`

## Story template
```ts
import type { Meta, StoryObj } from '@storybook/web-components-vite';
import './snice-<name>';

type Args = { variant?: string; disabled?: boolean; label?: string };

const meta: Meta<Args> = {
  title: 'Form/<PascalName>',
  component: 'snice-<name>',
  tags: ['autodocs'],
  argTypes: {
    variant:  { control: 'select', options: ['default', 'primary'] },
    disabled: { control: 'boolean' },
    label:    { control: 'text' },
  },
  render: (args) => {
    const el = document.createElement('snice-<name>');
    if (args.variant  !== undefined) el.setAttribute('variant', String(args.variant));
    if (args.disabled)               el.toggleAttribute('disabled', true);
    el.textContent = args.label ?? '';
    return el;
  },
};
export default meta;

type Story = StoryObj<Args>;
export const Default: Story = { args: { variant: 'default', label: 'Default' } };
export const AllVariants: Story = { render: () => { /* build DOM */ } };
```

## DOM APIs in render
- String attrs: `el.setAttribute('foo', value)`
- Boolean attrs: `el.toggleAttribute('foo', bool)`
- Object/Array props: `(el as any).foo = value`
- Text content: `el.textContent = '...'`

## IMPORTANT: NO LIT
- Do NOT import from `lit`, `lit-html`, or `lit-element`
- Do NOT import `html` from `'snice'` in stories
- Snice components are standard custom elements; mount via `document.createElement`

## Theme
- CSS loaded from `/snice-components/theme/theme.css` in preview.ts
- `data-theme="dark"` set on `<html>` by default
- Theme switcher in toolbar toggles `dark` / `light`

## Decorator config (SWC)
`.storybook/main.ts` injects `unplugin-swc` via `viteFinal` with `decoratorVersion: '2022-03'`.
Never use `experimentalDecorators`.

## Long-form docs
See `docs/STORYBOOK.md`

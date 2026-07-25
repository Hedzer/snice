import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-chip';
import type { ChipVariant, ChipSize, ChipShape } from './snice-chip.types';

type Args = {
  label?: string;
  variant?: ChipVariant;
  size?: ChipSize;
  shape?: ChipShape;
  removable?: boolean;
  selectable?: boolean;
  selected?: boolean;
  disabled?: boolean;
  icon?: string;
  avatar?: string;
};

const VARIANTS: ChipVariant[] = ['default', 'primary', 'success', 'warning', 'error', 'info'];
const SIZES: ChipSize[] = ['small', 'medium', 'large'];
const SHAPES: ChipShape[] = ['pill', 'rounded', 'square'];

function makeChip(label: string, attrs: Record<string, string | boolean> = {}) {
  const el = document.createElement('snice-chip');
  el.setAttribute('label', label);
  for (const [k, v] of Object.entries(attrs)) {
    if (typeof v === 'boolean') { if (v) el.toggleAttribute(k, true); }
    else el.setAttribute(k, v);
  }
  return el;
}

function row(...els: HTMLElement[]) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;gap:.5rem;flex-wrap:wrap;align-items:center;';
  els.forEach(el => wrap.appendChild(el));
  return wrap;
}

function col(...els: HTMLElement[]) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;flex-direction:column;gap:.75rem;';
  els.forEach(el => wrap.appendChild(el));
  return wrap;
}

const meta: Meta<Args> = {
  title: 'Chip',
  component: 'snice-chip',
  tags: ['autodocs'],
  argTypes: {
    label:    { control: 'text' },
    variant:  { control: 'select', options: VARIANTS },
    size:     { control: 'select', options: SIZES },
    shape:    { control: 'select', options: SHAPES },
    removable:{ control: 'boolean' },
    selectable:{ control: 'boolean' },
    selected: { control: 'boolean' },
    disabled: { control: 'boolean' },
    icon:     { control: 'text' },
    avatar:   { control: 'text' },
  },
  render: (args) => {
    const el = document.createElement('snice-chip');
    el.setAttribute('label', args.label ?? 'Chip');
    if (args.variant  !== undefined) el.setAttribute('variant', String(args.variant));
    if (args.size     !== undefined) el.setAttribute('size',    String(args.size));
    if (args.shape    !== undefined) el.setAttribute('shape',   String(args.shape));
    if (args.icon     !== undefined) el.setAttribute('icon',    String(args.icon));
    if (args.avatar   !== undefined) el.setAttribute('avatar',  String(args.avatar));
    if (args.removable) el.toggleAttribute('removable', true);
    if (args.selectable) el.toggleAttribute('selectable', true);
    if (args.selected)  el.toggleAttribute('selected',  true);
    if (args.disabled)  el.toggleAttribute('disabled',  true);
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:.75rem;flex-wrap:wrap;align-items:center;';
    wrap.appendChild(el);
    return wrap;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {
  args: { label: 'Default', variant: 'default', size: 'medium' },
};

// h2: All variants
export const AllVariants: Story = {
  render: () => row(...VARIANTS.map(v => makeChip(v.charAt(0).toUpperCase() + v.slice(1), { variant: v }))),
};

// h2: All variants x Selected
export const AllVariantsXSelected: Story = {
  render: () => row(...VARIANTS.map(v => makeChip(v.charAt(0).toUpperCase() + v.slice(1), { variant: v, selected: true }))),
};

// h2: All sizes
export const AllSizes: Story = {
  render: () => row(...SIZES.map(s => makeChip(s.charAt(0).toUpperCase() + s.slice(1), { size: s, variant: 'primary' }))),
};

// h2: Sizes x Variants (primary)
export const SizesXVariants: Story = {
  render: () => col(
    ...SIZES.map(s => row(...VARIANTS.map(v => makeChip(v, { size: s, variant: v })))),
  ),
};

// h2: All shapes
export const AllShapes: Story = {
  render: () => row(...SHAPES.map(sh => makeChip(sh.charAt(0).toUpperCase() + sh.slice(1), { shape: sh, variant: 'primary' }))),
};

// h2: Shapes x Variants
export const ShapesXVariants: Story = {
  render: () => col(
    ...SHAPES.map(sh => row(...VARIANTS.map(v => makeChip(v, { shape: sh, variant: v })))),
  ),
};

// h2: Selectable (click to toggle selected state)
export const Selectable: Story = {
  render: () => row(...VARIANTS.map(v => makeChip(v.charAt(0).toUpperCase() + v.slice(1), { variant: v, selectable: true }))),
};

// h2: Selectable + Selected
export const SelectableSelected: Story = {
  render: () => row(...VARIANTS.map(v => makeChip(v.charAt(0).toUpperCase() + v.slice(1), { variant: v, selectable: true, selected: true }))),
};

// h2: Removable
export const Removable: Story = {
  render: () => row(...VARIANTS.map(v => makeChip(v.charAt(0).toUpperCase() + v.slice(1), { variant: v, removable: true }))),
};

// h2: Removable x Sizes
export const RemovableXSizes: Story = {
  render: () => col(
    ...SIZES.map(s => row(...VARIANTS.map(v => makeChip(v, { variant: v, size: s, removable: true })))),
  ),
};

// h2: Disabled
export const Disabled: Story = {
  render: () => row(...VARIANTS.map(v => makeChip(v.charAt(0).toUpperCase() + v.slice(1), { variant: v, disabled: true }))),
};

// h2: Icon property (emoji)
export const IconPropertyEmoji: Story = {
  render: () => row(
    makeChip('React',    { variant: 'primary', icon: '⚛️' }),
    makeChip('Approved', { variant: 'success', icon: 'check-circle' }),
    makeChip('Critical', { variant: 'error',   icon: 'exclamation-triangle' }),
    makeChip('Pending',  { variant: 'warning', icon: '⏳' }),
  ),
};

// h2: Icon slot (Material Symbols)
export const IconSlotMaterialSymbols: Story = {
  render: () => {
    const items: [string, ChipVariant, string][] = [
      ['Home',   'primary', 'home'],
      ['Settings', 'default', 'settings'],
      ['Verified', 'success', 'verified'],
    ];
    return row(...items.map(([label, variant, symbol]) => {
      const el = document.createElement('snice-chip');
      el.setAttribute('label', label);
      el.setAttribute('variant', variant);
      const iconSpan = document.createElement('span');
      iconSpan.slot = 'icon';
      iconSpan.style.fontFamily = 'Material Symbols Outlined';
      iconSpan.textContent = symbol;
      el.appendChild(iconSpan);
      return el;
    }));
  },
};

// h2: Avatar
export const Avatar: Story = {
  render: () => row(
    makeChip('Alice Park',  { avatar: 'https://i.pravatar.cc/32?img=1' }),
    makeChip('Bob Lee',     { avatar: 'https://i.pravatar.cc/32?img=2', variant: 'primary' }),
    makeChip('Carol Diaz',  { avatar: 'https://i.pravatar.cc/32?img=3', variant: 'success' }),
  ),
};

// h2: Avatar x Sizes
export const AvatarXSizes: Story = {
  render: () => col(
    ...SIZES.map(s => row(
      makeChip('Alice', { avatar: 'https://i.pravatar.cc/32?img=1', size: s }),
      makeChip('Bob',   { avatar: 'https://i.pravatar.cc/32?img=2', size: s, variant: 'primary' }),
    )),
  ),
};

// h2: Edge: long text
export const EdgeLongText: Story = {
  render: () => row(
    makeChip('This is a very long chip label that tests overflow behavior', { variant: 'primary' }),
  ),
};

// h2: Edge: single character
export const EdgeSingleCharacter: Story = {
  render: () => row(
    makeChip('A', { variant: 'primary' }),
    makeChip('!', { variant: 'warning' }),
    makeChip('?', { variant: 'error' }),
  ),
};

// h2: Edge: empty label
export const EdgeEmptyLabel: Story = {
  render: () => row(
    makeChip('', { variant: 'default' }),
    makeChip('', { variant: 'primary', removable: true }),
  ),
};

// h2: CSS Parts Styling
// Parts: icon
export const CSSPartsStyling: Story = {
  render: () => {
    const style = document.createElement('style');
    style.textContent = `
      /* snice-chip exposes the following CSS parts:
         ::part(icon) — the icon slot container span */
      .parts-demo .default-chip::part(icon) { /* no overrides */ }
      .parts-demo .styled-chip::part(icon) {
        background: #fbbf24;
        color: #78350f;
        border-radius: 50%;
        width: 1.5rem;
        height: 1.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: .9rem;
        box-shadow: 0 0 0 2px #f59e0b;
      }
    `;

    const wrap = document.createElement('div');
    wrap.className = 'parts-demo';
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';

    const lbl1 = document.createElement('p');
    lbl1.textContent = 'Default (no ::part() overrides)';
    lbl1.style.cssText = 'margin:0;font-size:.75rem;opacity:.6;';

    const defaultChip = document.createElement('snice-chip');
    defaultChip.className = 'default-chip';
    defaultChip.setAttribute('label', 'Default icon');
    defaultChip.setAttribute('icon', 'star');

    const lbl2 = document.createElement('p');
    lbl2.textContent = 'Styled via ::part(icon) — amber circle with ring';
    lbl2.style.cssText = 'margin:0;font-size:.75rem;opacity:.6;';

    const styledChip = document.createElement('snice-chip');
    styledChip.className = 'styled-chip';
    styledChip.setAttribute('label', 'Styled icon');
    styledChip.setAttribute('icon', 'star');

    wrap.appendChild(style);
    wrap.appendChild(lbl1);
    wrap.appendChild(defaultChip);
    wrap.appendChild(lbl2);
    wrap.appendChild(styledChip);
    return wrap;
  },
};

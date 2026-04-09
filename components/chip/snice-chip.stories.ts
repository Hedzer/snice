import type { Meta, StoryObj } from '@storybook/web-components-vite';
import './snice-chip';
import type { ChipVariant, ChipSize } from './snice-chip.types';

type Args = {
  label?: string;
  variant?: ChipVariant;
  size?: ChipSize;
  removable?: boolean;
  selected?: boolean;
  disabled?: boolean;
  icon?: string;
  avatar?: string;
};

const VARIANTS: ChipVariant[] = ['default', 'primary', 'success', 'warning', 'error', 'info'];
const SIZES: ChipSize[] = ['small', 'medium', 'large'];

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
  title: 'Feedback/Chip',
  component: 'snice-chip',
  tags: ['autodocs'],
  argTypes: {
    label:    { control: 'text' },
    variant:  { control: 'select', options: VARIANTS },
    size:     { control: 'select', options: SIZES },
    removable:{ control: 'boolean' },
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
    if (args.icon     !== undefined) el.setAttribute('icon',    String(args.icon));
    if (args.avatar   !== undefined) el.setAttribute('avatar',  String(args.avatar));
    if (args.removable) el.toggleAttribute('removable', true);
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
    makeChip('Approved', { variant: 'success', icon: '✅' }),
    makeChip('Critical', { variant: 'error',   icon: '🚨' }),
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

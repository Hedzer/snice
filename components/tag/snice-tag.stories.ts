import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-tag';
import type { TagVariant, TagSize } from './snice-tag.types';

type Args = {
  variant?: TagVariant;
  size?: TagSize;
  removable?: boolean;
  outline?: boolean;
  pill?: boolean;
  label?: string;
};

const VARIANTS: TagVariant[] = ['default', 'primary', 'success', 'warning', 'danger', 'info'];
const SIZES: TagSize[] = ['small', 'medium', 'large'];

function makeTag(variant: TagVariant, label: string, attrs: Record<string, boolean> = {}) {
  const el = document.createElement('snice-tag');
  el.setAttribute('variant', variant);
  for (const [k, v] of Object.entries(attrs)) {
    if (v) el.toggleAttribute(k, true);
  }
  el.textContent = label;
  return el;
}

function row(...els: HTMLElement[]) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;gap:.5rem;flex-wrap:wrap;align-items:center;';
  els.forEach(el => wrap.appendChild(el));
  return wrap;
}

const meta: Meta<Args> = {
  title: 'Form/Tag',
  component: 'snice-tag',
  tags: ['autodocs'],
  argTypes: {
    variant:  { control: 'select', options: VARIANTS },
    size:     { control: 'select', options: SIZES },
    removable:{ control: 'boolean' },
    outline:  { control: 'boolean' },
    pill:     { control: 'boolean' },
    label:    { control: 'text' },
  },
  render: (args) => {
    const el = document.createElement('snice-tag');
    if (args.variant !== undefined) el.setAttribute('variant', String(args.variant));
    if (args.size    !== undefined) el.setAttribute('size',    String(args.size));
    if (args.removable) el.toggleAttribute('removable', true);
    if (args.outline)   el.toggleAttribute('outline',   true);
    if (args.pill)      el.toggleAttribute('pill',      true);
    el.textContent = args.label ?? 'Tag';
    return el;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {
  args: { variant: 'default', size: 'medium', label: 'Default' },
};

// h2: Variants
export const Variants: Story = {
  render: () => row(...VARIANTS.map(v => makeTag(v, v.charAt(0).toUpperCase() + v.slice(1)))),
};

// h2: Sizes
export const Sizes: Story = {
  render: () => {
    const wrap = row();
    for (const size of SIZES) {
      const el = document.createElement('snice-tag');
      el.setAttribute('variant', 'primary');
      el.setAttribute('size', size);
      el.textContent = size.charAt(0).toUpperCase() + size.slice(1);
      wrap.appendChild(el);
    }
    return wrap;
  },
};

// h2: Variant x Size Matrix
export const VariantXSizeMatrix: Story = {
  render: () => {
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(3,auto);gap:.5rem;align-items:center;';
    for (const variant of VARIANTS) {
      for (const size of SIZES) {
        const el = document.createElement('snice-tag');
        el.setAttribute('variant', variant);
        el.setAttribute('size', size);
        el.textContent = `${variant} ${size}`;
        grid.appendChild(el);
      }
    }
    return grid;
  },
};

// h2: Removable
export const Removable: Story = {
  render: () => row(...VARIANTS.map(v => makeTag(v, v.charAt(0).toUpperCase() + v.slice(1), { removable: true }))),
};

// h2: Outline
export const Outline: Story = {
  render: () => row(...VARIANTS.map(v => makeTag(v, v.charAt(0).toUpperCase() + v.slice(1), { outline: true }))),
};

// h2: Pill
export const Pill: Story = {
  render: () => row(...VARIANTS.map(v => makeTag(v, v.charAt(0).toUpperCase() + v.slice(1), { pill: true }))),
};

// h2: Outline + Pill
export const OutlinePill: Story = {
  render: () => row(...VARIANTS.map(v => makeTag(v, v.charAt(0).toUpperCase() + v.slice(1), { outline: true, pill: true }))),
};

// h2: Removable + Pill
export const RemovablePill: Story = {
  render: () => row(
    makeTag('primary', 'Removable Pill', { removable: true, pill: true }),
    makeTag('success', 'Removable Pill', { removable: true, pill: true }),
    makeTag('danger',  'Removable Pill', { removable: true, pill: true }),
  ),
};

// h2: Removable + Outline + Pill
export const RemovableOutlinePill: Story = {
  render: () => row(
    makeTag('primary', 'All modifiers', { removable: true, outline: true, pill: true }),
    makeTag('success', 'All modifiers', { removable: true, outline: true, pill: true }),
    makeTag('danger',  'All modifiers', { removable: true, outline: true, pill: true }),
  ),
};

// h2: With Icon Slot (Emoji)
export const WithIconSlotEmoji: Story = {
  render: () => {
    const items: [TagVariant, string, string][] = [
      ['primary', '💻', 'Development'],
      ['success', '✅', 'Approved'],
      ['danger',  '🚨', 'Critical'],
      ['warning', '⚠️', 'Caution'],
      ['info',    'ℹ️', 'Note'],
    ];
    return row(...items.map(([variant, emoji, label]) => {
      const el = document.createElement('snice-tag');
      el.setAttribute('variant', variant);
      const icon = document.createElement('span');
      icon.slot = 'icon';
      icon.textContent = emoji;
      el.appendChild(icon);
      el.appendChild(document.createTextNode(' ' + label));
      return el;
    }));
  },
};

// h2: Long Text
export const LongText: Story = {
  render: () => row(
    makeTag('primary', 'This is a tag with very long text content'),
    makeTag('success', 'Another long tag label here'),
  ),
};

export const AllVariants: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:.75rem;';
    wrap.appendChild(row(...VARIANTS.map(v => makeTag(v, v.charAt(0).toUpperCase() + v.slice(1)))));
    wrap.appendChild(row(...VARIANTS.map(v => makeTag(v, v.charAt(0).toUpperCase() + v.slice(1), { outline: true }))));
    wrap.appendChild(row(...VARIANTS.map(v => makeTag(v, v.charAt(0).toUpperCase() + v.slice(1), { pill: true }))));
    wrap.appendChild(row(...VARIANTS.map(v => makeTag(v, v.charAt(0).toUpperCase() + v.slice(1), { removable: true }))));
    return wrap;
  },
};

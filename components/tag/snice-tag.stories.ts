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

// Available CSS Parts: base, icon, label
export const CSSPartsStyling: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:2rem;';

    const defaultSection = document.createElement('div');
    const defaultLabel = document.createElement('h3');
    defaultLabel.textContent = 'Default';
    defaultLabel.style.cssText = 'margin:0 0 .5rem;font-size:.875rem;color:#888;';
    defaultSection.appendChild(defaultLabel);
    defaultSection.appendChild(row(
      makeTag('primary', 'Primary'),
      makeTag('success', 'Success'),
      makeTag('danger',  'Danger'),
      makeTag('warning', 'Warning'),
    ));
    wrap.appendChild(defaultSection);

    const styledSection = document.createElement('div');
    styledSection.className = 'parts-demo-tag';
    const styledLabel = document.createElement('h3');
    styledLabel.textContent = 'Styled with ::part()';
    styledLabel.style.cssText = 'margin:0 0 .5rem;font-size:.875rem;color:#888;';
    styledSection.appendChild(styledLabel);

    const style = document.createElement('style');
    style.textContent = `
      .parts-demo-tag snice-tag::part(base) {
        background: linear-gradient(135deg, #0f172a, #1e293b);
        border: 1.5px solid #38bdf8;
        border-radius: 6px;
        box-shadow: 0 0 8px rgba(56, 189, 248, 0.35), inset 0 1px 0 rgba(255,255,255,0.05);
        padding: 0.25rem 0.65rem;
        transition: box-shadow 0.2s;
      }
      .parts-demo-tag snice-tag::part(base):hover {
        box-shadow: 0 0 16px rgba(56, 189, 248, 0.6);
      }
      .parts-demo-tag snice-tag::part(label) {
        color: #7dd3fc;
        font-weight: 700;
        font-size: 0.75rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      .parts-demo-tag snice-tag::part(icon) {
        color: #38bdf8;
        filter: drop-shadow(0 0 3px rgba(56, 189, 248, 0.7));
      }
    `;
    styledSection.appendChild(style);

    const t1 = document.createElement('snice-tag');
    t1.setAttribute('variant', 'primary');
    t1.textContent = 'Custom';

    const t2 = document.createElement('snice-tag');
    t2.setAttribute('variant', 'success');
    const icon2 = document.createElement('span');
    icon2.slot = 'icon';
    icon2.textContent = '✓';
    t2.appendChild(icon2);
    t2.appendChild(document.createTextNode(' Verified'));

    const t3 = document.createElement('snice-tag');
    t3.setAttribute('variant', 'danger');
    t3.textContent = 'Alert';

    const t4 = document.createElement('snice-tag');
    t4.setAttribute('variant', 'warning');
    t4.textContent = 'Beta';

    styledSection.appendChild(row(t1, t2, t3, t4));
    wrap.appendChild(styledSection);

    return wrap;
  },
};

import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-badge';
import type { BadgeVariant, BadgePosition, BadgeSize } from './snice-badge.types';

type Args = {
  content?: string;
  count?: number;
  max?: number;
  dot?: boolean;
  variant?: BadgeVariant;
  position?: BadgePosition;
  inline?: boolean;
  size?: BadgeSize;
  pulse?: boolean;
  offset?: number;
};

const VARIANTS: BadgeVariant[] = ['default', 'primary', 'success', 'warning', 'error', 'info'];
const SIZES: BadgeSize[] = ['small', 'medium', 'large'];
const POSITIONS: BadgePosition[] = ['top-right', 'top-left', 'bottom-right', 'bottom-left'];

function makeBox(text = '📦'): HTMLElement {
  const box = document.createElement('div');
  box.style.cssText = 'width:3rem;height:3rem;background:var(--snice-color-background-element,#f0f0f0);border-radius:.5rem;display:flex;align-items:center;justify-content:center;font-size:1.5rem;';
  box.textContent = text;
  return box;
}

function makeBadge(attrs: Record<string, string | boolean | number> = {}, boxText?: string): HTMLElement {
  const el = document.createElement('snice-badge');
  for (const [k, v] of Object.entries(attrs)) {
    if (typeof v === 'boolean') { if (v) el.toggleAttribute(k, true); }
    else el.setAttribute(k, String(v));
  }
  if (boxText !== undefined) el.appendChild(makeBox(boxText));
  return el;
}

function row(...els: HTMLElement[]): HTMLElement {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;align-items:center;gap:1.5rem;flex-wrap:wrap;';
  els.forEach(el => wrap.appendChild(el));
  return wrap;
}

const meta: Meta<Args> = {
  title: 'Data/Badge',
  component: 'snice-badge',
  tags: ['autodocs'],
  argTypes: {
    content:  { control: 'text' },
    count:    { control: 'number' },
    max:      { control: 'number' },
    dot:      { control: 'boolean' },
    variant:  { control: 'select', options: VARIANTS },
    position: { control: 'select', options: POSITIONS },
    inline:   { control: 'boolean' },
    size:     { control: 'select', options: SIZES },
    pulse:    { control: 'boolean' },
    offset:   { control: 'number' },
  },
  render: (args) => {
    const el = document.createElement('snice-badge');
    if (args.content  !== undefined) el.setAttribute('content',  String(args.content));
    if (args.count    !== undefined) el.setAttribute('count',    String(args.count));
    if (args.max      !== undefined) el.setAttribute('max',      String(args.max));
    if (args.variant  !== undefined) el.setAttribute('variant',  String(args.variant));
    if (args.position !== undefined) el.setAttribute('position', String(args.position));
    if (args.size     !== undefined) el.setAttribute('size',     String(args.size));
    if (args.offset   !== undefined) el.setAttribute('offset',   String(args.offset));
    if (args.dot)    el.toggleAttribute('dot',    true);
    if (args.inline) el.toggleAttribute('inline', true);
    if (args.pulse)  el.toggleAttribute('pulse',  true);
    el.appendChild(makeBox());
    return el;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = { args: { content: '5', variant: 'primary' } };

// h2: All variants
export const AllVariants: Story = {
  render: () => row(...VARIANTS.map(v => makeBadge({ content: '5', variant: v }, '📦'))),
};

// h2: All sizes
export const AllSizes: Story = {
  render: () => row(...SIZES.map(s => makeBadge({ content: '3', variant: 'error', size: s }, '🔔'))),
};

// h2: Variant x Size matrix
export const VariantXSizeMatrix: Story = {
  render: () => {
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:auto repeat(6,1fr);gap:1rem;align-items:center;';
    for (const size of SIZES) {
      const lbl = document.createElement('div');
      lbl.style.cssText = 'font-size:.7rem;color:#888;text-align:right;padding-right:.5rem;';
      lbl.textContent = size;
      grid.appendChild(lbl);
      for (const variant of VARIANTS) {
        grid.appendChild(makeBadge({ content: '1', variant, size }, 'A'));
      }
    }
    return grid;
  },
};

// h2: All positions
export const AllPositions: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:1.5rem;flex-wrap:wrap;';
    const positions: [BadgePosition, string][] = [
      ['top-right', 'top-right'],
      ['top-left', 'top-left'],
      ['bottom-right', 'bottom-right'],
      ['bottom-left', 'bottom-left'],
    ];
    for (const [position, label] of positions) {
      const item = document.createElement('div');
      item.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:.35rem;';
      item.appendChild(makeBadge({ content: '1', variant: 'error', position }, '⬛'));
      const span = document.createElement('span');
      span.style.cssText = 'font-size:.65rem;color:#888;';
      span.textContent = label;
      item.appendChild(span);
      wrap.appendChild(item);
    }
    return wrap;
  },
};

// h2: Dot mode
export const DotMode: Story = {
  render: () => row(...VARIANTS.map(v => makeBadge({ dot: true, variant: v }, '💬'))),
};

// h2: Pulse animation
export const PulseAnimation: Story = {
  render: () => row(
    makeBadge({ dot: true, pulse: true, variant: 'error' }, '🔔'),
    makeBadge({ content: '!', pulse: true, variant: 'error' }, '🔔'),
    makeBadge({ content: '3', pulse: true, variant: 'primary' }, '🔔'),
  ),
};

// h2: Count property with max
export const CountPropertyWithMax: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:1.5rem;flex-wrap:wrap;';
    const counts = [5, 42, 99, 100, 999];
    for (const count of counts) {
      const item = document.createElement('div');
      item.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:.35rem;';
      item.appendChild(makeBadge({ count, variant: 'error' }, '📧'));
      const span = document.createElement('span');
      span.style.cssText = 'font-size:.65rem;color:#888;';
      span.textContent = `count=${count}`;
      item.appendChild(span);
      wrap.appendChild(item);
    }
    return wrap;
  },
};

// h2: Custom max
export const CustomMax: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:1.5rem;flex-wrap:wrap;';
    const cases: [number, number][] = [[10, 9], [1000, 999]];
    for (const [count, max] of cases) {
      const item = document.createElement('div');
      item.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:.35rem;';
      item.appendChild(makeBadge({ count, max, variant: 'error' }, '💬'));
      const span = document.createElement('span');
      span.style.cssText = 'font-size:.65rem;color:#888;';
      span.textContent = `max=${max}, count=${count}`;
      item.appendChild(span);
      wrap.appendChild(item);
    }
    return wrap;
  },
};

// h2: Content property (text)
export const ContentPropertyText: Story = {
  render: () => row(
    makeBadge({ content: 'NEW', variant: 'primary' }, '🎁'),
    makeBadge({ content: 'HOT', variant: 'error' }, '🔥'),
    makeBadge({ content: 'BETA', variant: 'warning' }, '⚙️'),
    makeBadge({ content: '!', variant: 'error' }, '⚠️'),
  ),
};

// h2: Inline mode
export const InlineMode: Story = {
  render: () => row(
    makeBadge({ content: '5', variant: 'error', inline: true }),
    makeBadge({ content: 'NEW', variant: 'primary', inline: true }),
    makeBadge({ dot: true, variant: 'success', inline: true }),
    makeBadge({ content: '99+', variant: 'warning', inline: true }),
  ),
};

// h2: Offset values
export const OffsetValues: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:1.5rem;flex-wrap:wrap;';
    for (const offset of [0, 4, 8]) {
      const item = document.createElement('div');
      item.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:.35rem;';
      item.appendChild(makeBadge({ content: String(offset), variant: 'error', offset }, 'A'));
      const span = document.createElement('span');
      span.style.cssText = 'font-size:.65rem;color:#888;';
      span.textContent = `offset=${offset}`;
      item.appendChild(span);
      wrap.appendChild(item);
    }
    return wrap;
  },
};

// h2: Edge case: no badge shown (count=0, no content, no dot)
export const EdgeCaseNoBadge: Story = {
  render: () => makeBadge({ variant: 'error' }, '📦'),
};

// h2: Dot x Position matrix
export const DotXPositionMatrix: Story = {
  render: () => row(
    makeBadge({ dot: true, variant: 'error', position: 'top-right' }, 'TR'),
    makeBadge({ dot: true, variant: 'error', position: 'top-left' }, 'TL'),
    makeBadge({ dot: true, variant: 'error', position: 'bottom-right' }, 'BR'),
    makeBadge({ dot: true, variant: 'error', position: 'bottom-left' }, 'BL'),
  ),
};

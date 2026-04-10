import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-progress-ring';
import type { ProgressRingSize } from './snice-progress-ring.types';

type Args = {
  value?: number;
  max?: number;
  size?: ProgressRingSize;
  thickness?: number;
  color?: string;
  showValue?: boolean;
  label?: string;
};

const SIZES: ProgressRingSize[] = ['small', 'medium', 'large'];

function makeRing(attrs: Record<string, string | number | boolean> = {}) {
  const el = document.createElement('snice-progress-ring');
  for (const [k, v] of Object.entries(attrs)) {
    if (typeof v === 'boolean') { if (v) el.toggleAttribute(k, true); }
    else el.setAttribute(k, String(v));
  }
  return el;
}

function row(...els: HTMLElement[]) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;gap:1.5rem;flex-wrap:wrap;align-items:center;';
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
  title: 'Feedback/ProgressRing',
  component: 'snice-progress-ring',
  tags: ['autodocs'],
  argTypes: {
    value:     { control: 'number' },
    max:       { control: 'number' },
    size:      { control: 'select', options: SIZES },
    thickness: { control: 'number' },
    color:     { control: 'text' },
    showValue: { control: 'boolean' },
    label:     { control: 'text' },
  },
  render: (args) => {
    const el = document.createElement('snice-progress-ring');
    if (args.value     !== undefined) el.setAttribute('value',     String(args.value));
    if (args.max       !== undefined) el.setAttribute('max',       String(args.max));
    if (args.size      !== undefined) el.setAttribute('size',      String(args.size));
    if (args.thickness !== undefined) el.setAttribute('thickness', String(args.thickness));
    if (args.color     !== undefined) el.setAttribute('color',     String(args.color));
    if (args.label     !== undefined) el.setAttribute('label',     String(args.label));
    if (args.showValue) el.toggleAttribute('show-value', true);
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:.75rem;flex-wrap:wrap;align-items:center;';
    wrap.appendChild(el);
    return wrap;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {
  args: { value: 60, max: 100, size: 'medium', showValue: true },
};

// h2: Values: 0, 25, 50, 75, 100
export const Values: Story = {
  render: () => row(
    ...[0, 25, 50, 75, 100].map(v => makeRing({ value: v, 'show-value': true })),
  ),
};

// h2: Size: small
export const SizeSmall: Story = {
  render: () => row(makeRing({ value: 60, size: 'small', 'show-value': true })),
};

// h2: Size: medium (default)
export const SizeMedium: Story = {
  render: () => row(makeRing({ value: 60, size: 'medium', 'show-value': true })),
};

// h2: Size: large
export const SizeLarge: Story = {
  render: () => row(makeRing({ value: 60, size: 'large', 'show-value': true })),
};

// h2: All sizes
export const AllSizes: Story = {
  render: () => row(
    ...SIZES.map(s => makeRing({ value: 60, size: s, 'show-value': true })),
  ),
};

// h2: show-value: false (default)
export const ShowValueFalse: Story = {
  render: () => row(makeRing({ value: 60 })),
};

// h2: show-value: true
export const ShowValueTrue: Story = {
  render: () => row(makeRing({ value: 60, 'show-value': true })),
};

// h2: Label (custom center text)
export const Label: Story = {
  render: () => row(
    makeRing({ value: 75, label: 'Score' }),
    makeRing({ value: 100, label: 'Done', color: '#22c55e' }),
    makeRing({ value: 30, label: '30/100' }),
  ),
};

// h2: Label + show-value together
export const LabelShowValueTogether: Story = {
  render: () => row(
    makeRing({ value: 65, label: 'Progress', 'show-value': true }),
  ),
};

// h2: Thickness: 2
export const Thickness2: Story = {
  render: () => row(makeRing({ value: 60, thickness: 2, 'show-value': true })),
};

// h2: Thickness: 4 (default)
export const Thickness4: Story = {
  render: () => row(makeRing({ value: 60, thickness: 4, 'show-value': true })),
};

// h2: Thickness: 6
export const Thickness6: Story = {
  render: () => row(makeRing({ value: 60, thickness: 6, 'show-value': true })),
};

// h2: Thickness: 8
export const Thickness8: Story = {
  render: () => row(makeRing({ value: 60, thickness: 8, 'show-value': true })),
};

// h2: Custom color: #10b981
export const CustomColor10b981: Story = {
  render: () => row(makeRing({ value: 75, color: '#10b981', 'show-value': true })),
};

// h2: Custom color: #ef4444
export const CustomColorEf4444: Story = {
  render: () => row(makeRing({ value: 45, color: '#ef4444', 'show-value': true })),
};

// h2: Custom color: #8b5cf6
export const CustomColor8b5cf6: Story = {
  render: () => row(makeRing({ value: 60, color: '#8b5cf6', 'show-value': true })),
};

// h2: Custom color: #f59e0b
export const CustomColorF59e0b: Story = {
  render: () => row(makeRing({ value: 85, color: '#f59e0b', 'show-value': true })),
};

// h2: No color (default theme)
export const NoColor: Story = {
  render: () => row(makeRing({ value: 60, 'show-value': true })),
};

// h2: Custom max (value=150, max=200)
export const CustomMax: Story = {
  render: () => row(makeRing({ value: 150, max: 200, 'show-value': true })),
};

// h2: Value exceeds max (clamped to 100%)
export const ValueExceedsMax: Story = {
  render: () => row(makeRing({ value: 150, max: 100, 'show-value': true })),
};

// h2: Value = 0 (empty ring)
export const ValueZero: Story = {
  render: () => row(makeRing({ value: 0, 'show-value': true })),
};

// h2: Size x Color matrix
export const SizeXColorMatrix: Story = {
  render: () => {
    const colors = ['#10b981', '#ef4444', '#8b5cf6', '#f59e0b'];
    return col(
      ...SIZES.map(s => row(...colors.map(c => makeRing({ value: 65, size: s, color: c, 'show-value': true })))),
    );
  },
};

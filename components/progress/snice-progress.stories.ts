import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-progress';
import type { ProgressVariant, ProgressSize, ProgressColor } from './snice-progress.types';

type Args = {
  value?: number;
  max?: number;
  variant?: ProgressVariant;
  size?: ProgressSize;
  color?: string;
  indeterminate?: boolean;
  showLabel?: boolean;
  label?: string;
  striped?: boolean;
  animated?: boolean;
  thickness?: number;
};

const VARIANTS: ProgressVariant[] = ['linear', 'circular'];
const SIZES: ProgressSize[] = ['small', 'medium', 'large', 'xl', 'xxl', 'xxxl'];
const COLORS: string[] = ['primary', 'success', 'warning', 'error', 'info'];

function makeProgress(attrs: Record<string, string | boolean | number> = {}) {
  const el = document.createElement('snice-progress');
  for (const [k, v] of Object.entries(attrs)) {
    if (typeof v === 'boolean') { if (v) el.toggleAttribute(k, true); }
    else el.setAttribute(k, String(v));
  }
  return el;
}

function row(...els: HTMLElement[]) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;gap:1rem;flex-wrap:wrap;align-items:center;';
  els.forEach(el => wrap.appendChild(el));
  return wrap;
}

function col(...els: HTMLElement[]) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;flex-direction:column;gap:.75rem;width:100%;';
  els.forEach(el => wrap.appendChild(el));
  return wrap;
}

const meta: Meta<Args> = {
  title: 'Feedback/Progress',
  component: 'snice-progress',
  tags: ['autodocs'],
  argTypes: {
    value:         { control: 'number' },
    max:           { control: 'number' },
    variant:       { control: 'select', options: VARIANTS },
    size:          { control: 'select', options: SIZES },
    color:         { control: 'text' },
    indeterminate: { control: 'boolean' },
    showLabel:     { control: 'boolean' },
    label:         { control: 'text' },
    striped:       { control: 'boolean' },
    animated:      { control: 'boolean' },
    thickness:     { control: 'number' },
  },
  render: (args) => {
    const el = document.createElement('snice-progress');
    if (args.value     !== undefined) el.setAttribute('value',     String(args.value));
    if (args.max       !== undefined) el.setAttribute('max',       String(args.max));
    if (args.variant   !== undefined) el.setAttribute('variant',   String(args.variant));
    if (args.size      !== undefined) el.setAttribute('size',      String(args.size));
    if (args.color     !== undefined) el.setAttribute('color',     String(args.color));
    if (args.label     !== undefined) el.setAttribute('label',     String(args.label));
    if (args.thickness !== undefined) el.setAttribute('thickness', String(args.thickness));
    if (args.indeterminate) el.toggleAttribute('indeterminate', true);
    if (args.showLabel)     el.toggleAttribute('show-label',    true);
    if (args.striped)       el.toggleAttribute('striped',       true);
    if (args.animated)      el.toggleAttribute('animated',      true);
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:.75rem;flex-wrap:wrap;align-items:center;width:100%;';
    wrap.appendChild(el);
    return wrap;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {
  args: { value: 65, variant: 'linear', color: 'primary', showLabel: true },
};

// h2: Variant: linear (default)
export const VariantLinear: Story = {
  render: () => col(
    makeProgress({ value: 65, 'show-label': true }),
  ),
};

// h2: Variant: circular
export const VariantCircular: Story = {
  render: () => row(
    makeProgress({ value: 65, variant: 'circular', 'show-label': true }),
  ),
};

// h2: Linear - Values: 0, 25, 50, 75, 100
export const LinearValues: Story = {
  render: () => col(
    ...[0, 25, 50, 75, 100].map(v => makeProgress({ value: v, 'show-label': true })),
  ),
};

// h2: Circular - Values: 0, 25, 50, 75, 100
export const CircularValues: Story = {
  render: () => row(
    ...[0, 25, 50, 75, 100].map(v => makeProgress({ value: v, variant: 'circular', 'show-label': true })),
  ),
};

// h2: Color: primary (default)
export const ColorPrimary: Story = {
  render: () => col(makeProgress({ value: 70, color: 'primary', 'show-label': true })),
};

// h2: Color: success
export const ColorSuccess: Story = {
  render: () => col(makeProgress({ value: 100, color: 'success', 'show-label': true })),
};

// h2: Color: warning
export const ColorWarning: Story = {
  render: () => col(makeProgress({ value: 89, color: 'warning', 'show-label': true })),
};

// h2: Color: error
export const ColorError: Story = {
  render: () => col(makeProgress({ value: 45, color: 'error', 'show-label': true })),
};

// h2: Color: info
export const ColorInfo: Story = {
  render: () => col(makeProgress({ value: 60, color: 'info', 'show-label': true })),
};

// h2: Color: custom hex (#8b5cf6)
export const ColorCustomHex: Story = {
  render: () => col(makeProgress({ value: 55, color: '#8b5cf6', 'show-label': true })),
};

// h2: Size: small (circular)
export const SizeSmallCircular: Story = {
  render: () => row(makeProgress({ value: 60, variant: 'circular', size: 'small', 'show-label': true })),
};

// h2: Size: medium (circular, default)
export const SizeMediumCircular: Story = {
  render: () => row(makeProgress({ value: 60, variant: 'circular', size: 'medium', 'show-label': true })),
};

// h2: Size: large (circular)
export const SizeLargeCircular: Story = {
  render: () => row(makeProgress({ value: 60, variant: 'circular', size: 'large', 'show-label': true })),
};

// h2: Size: xl (circular)
export const SizeXlCircular: Story = {
  render: () => row(makeProgress({ value: 60, variant: 'circular', size: 'xl', 'show-label': true })),
};

// h2: Size: xxl (circular)
export const SizeXxlCircular: Story = {
  render: () => row(makeProgress({ value: 60, variant: 'circular', size: 'xxl', 'show-label': true })),
};

// h2: Size: xxxl (circular)
export const SizeXxxlCircular: Story = {
  render: () => row(makeProgress({ value: 60, variant: 'circular', size: 'xxxl', 'show-label': true })),
};

// h2: All circular sizes at once
export const AllCircularSizesAtOnce: Story = {
  render: () => row(
    ...SIZES.map(s => makeProgress({ value: 60, variant: 'circular', size: s, 'show-label': true })),
  ),
};

// h2: show-label (linear)
export const ShowLabelLinear: Story = {
  render: () => col(
    makeProgress({ value: 65, 'show-label': true }),
    makeProgress({ value: 65 }),
  ),
};

// h2: show-label (circular)
export const ShowLabelCircular: Story = {
  render: () => row(
    makeProgress({ value: 65, variant: 'circular', 'show-label': true }),
    makeProgress({ value: 65, variant: 'circular' }),
  ),
};

// h2: Custom label text
export const CustomLabelText: Story = {
  render: () => col(
    makeProgress({ value: 65, 'show-label': true, label: 'Downloading...' }),
    makeProgress({ value: 100, 'show-label': true, label: 'Complete!' }),
  ),
};

// h2: Custom label (circular)
export const CustomLabelCircular: Story = {
  render: () => row(
    makeProgress({ value: 65, variant: 'circular', 'show-label': true, label: '65 MB' }),
    makeProgress({ value: 100, variant: 'circular', 'show-label': true, label: 'Done' }),
  ),
};

// h2: Indeterminate (linear)
export const IndeterminateLinear: Story = {
  render: () => col(makeProgress({ indeterminate: true })),
};

// h2: Indeterminate (circular)
export const IndeterminateCircular: Story = {
  render: () => row(makeProgress({ indeterminate: true, variant: 'circular' })),
};

// h2: Striped
export const Striped: Story = {
  render: () => col(
    makeProgress({ value: 50, striped: true }),
    makeProgress({ value: 75, striped: true, color: 'success' }),
  ),
};

// h2: Striped + animated
export const StripedAnimated: Story = {
  render: () => col(
    makeProgress({ value: 60, striped: true, animated: true }),
    makeProgress({ value: 80, striped: true, animated: true, color: 'warning' }),
  ),
};

// h2: Animated without striped
export const AnimatedWithoutStriped: Story = {
  render: () => col(makeProgress({ value: 70, animated: true })),
};

// h2: Custom max (value=3, max=10)
export const CustomMax: Story = {
  render: () => col(
    makeProgress({ value: 3, max: 10, 'show-label': true }),
    makeProgress({ value: 3, max: 10, variant: 'circular', 'show-label': true }),
  ),
};

// h2: Thickness: 2 (circular)
export const Thickness2Circular: Story = {
  render: () => row(makeProgress({ value: 60, variant: 'circular', thickness: 2, 'show-label': true })),
};

// h2: Thickness: 8 (circular)
export const Thickness8Circular: Story = {
  render: () => row(makeProgress({ value: 60, variant: 'circular', thickness: 8, 'show-label': true })),
};

// h2: Color x Variant matrix (circular)
export const ColorXVariantMatrixCircular: Story = {
  render: () => row(
    ...COLORS.map(c => makeProgress({ value: 65, variant: 'circular', color: c, 'show-label': true })),
  ),
};

// h2: Color x Striped (linear)
export const ColorXStripedLinear: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:.5rem;width:100%;';
    for (const c of COLORS) {
      wrap.appendChild(makeProgress({ value: 65, color: c, striped: true, 'show-label': true }));
    }
    return wrap;
  },
};

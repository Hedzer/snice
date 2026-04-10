import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-gauge';

type Args = {
  value?: number;
  min?: number;
  max?: number;
  label?: string;
  variant?: string;
  size?: string;
  showValue?: boolean;
  thickness?: number;
};

const VARIANTS = ['default', 'primary', 'success', 'warning', 'error', 'info'];
const SIZES = ['small', 'medium', 'large'];

function makeGauge(attrs: Record<string, string | number | boolean>) {
  const el = document.createElement('snice-gauge');
  for (const [k, v] of Object.entries(attrs)) {
    el.setAttribute(k, String(v));
  }
  return el;
}

function row(...els: HTMLElement[]) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;gap:1.5rem;flex-wrap:wrap;align-items:flex-start;';
  els.forEach(el => wrap.appendChild(el));
  return wrap;
}

const meta: Meta<Args> = {
  title: 'Charts/Gauge',
  component: 'snice-gauge',
  tags: ['autodocs'],
  argTypes: {
    value: { control: 'number' },
    min: { control: 'number' },
    max: { control: 'number' },
    label: { control: 'text' },
    variant: { control: 'select', options: VARIANTS },
    size: { control: 'select', options: SIZES },
    showValue: { control: 'boolean' },
    thickness: { control: 'number' },
  },
  render: (args) => {
    const el = document.createElement('snice-gauge');
    if (args.value !== undefined) el.setAttribute('value', String(args.value));
    if (args.min !== undefined) el.setAttribute('min', String(args.min));
    if (args.max !== undefined) el.setAttribute('max', String(args.max));
    if (args.label !== undefined) el.setAttribute('label', String(args.label));
    if (args.variant !== undefined) el.setAttribute('variant', String(args.variant));
    if (args.size !== undefined) el.setAttribute('size', String(args.size));
    if (args.showValue !== undefined) el.setAttribute('show-value', String(args.showValue));
    if (args.thickness !== undefined) el.setAttribute('thickness', String(args.thickness));
    return el;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = { args: { value: 65, variant: 'primary', label: 'CPU', size: 'medium' } };

// h2: Variant: default
export const VariantDefault: Story = {
  render: () => row(makeGauge({ variant: 'default', value: 65, label: 'Default' })),
};

// h2: All Variants
export const AllVariants: Story = {
  render: () => {
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:1.5rem;';
    VARIANTS.forEach(v => {
      grid.appendChild(makeGauge({ variant: v, value: 65, label: v.charAt(0).toUpperCase() + v.slice(1) }));
    });
    return grid;
  },
};

// h2: Size: small
export const SizeSmall: Story = {
  render: () => row(makeGauge({ size: 'small', value: 75, label: 'Small' })),
};

// h2: Size: medium (default)
export const SizeMedium: Story = {
  render: () => row(makeGauge({ size: 'medium', value: 75, label: 'Medium' })),
};

// h2: Size: large
export const SizeLarge: Story = {
  render: () => row(makeGauge({ size: 'large', value: 75, label: 'Large' })),
};

// h2: All Sizes Compared
export const AllSizesCompared: Story = {
  render: () => row(
    makeGauge({ size: 'small', value: 50, label: 'Small' }),
    makeGauge({ size: 'medium', value: 50, label: 'Medium' }),
    makeGauge({ size: 'large', value: 50, label: 'Large' }),
  ),
};

// h2: Value Range (0 to 100)
export const ValueRange: Story = {
  render: () => {
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:1.5rem;';
    [0, 10, 25, 50, 75, 90, 100].forEach(v => {
      grid.appendChild(makeGauge({ value: v, label: `${v}%` }));
    });
    return grid;
  },
};

// h2: Custom Min/Max (0-200)
export const CustomMinMax0To200: Story = {
  render: () => row(
    makeGauge({ value: 50, min: 0, max: 200, label: '50/200' }),
    makeGauge({ value: 100, min: 0, max: 200, label: '100/200' }),
    makeGauge({ value: 175, min: 0, max: 200, label: '175/200' }),
  ),
};

// h2: Custom Min/Max (negative range: -50 to 50)
export const CustomMinMaxNegativeRange: Story = {
  render: () => row(
    makeGauge({ value: -30, min: -50, max: 50, label: '-30' }),
    makeGauge({ value: 0, min: -50, max: 50, label: '0' }),
    makeGauge({ value: 40, min: -50, max: 50, label: '40' }),
  ),
};

// h2: showValue: false
export const ShowValueFalse: Story = {
  render: () => row(makeGauge({ value: 72, 'show-value': 'false', label: 'Hidden Value' })),
};

// h2: Thickness: 4
export const Thickness4: Story = {
  render: () => row(makeGauge({ value: 60, thickness: 4, label: 'Thin' })),
};

// h2: Thickness: 8 (default)
export const Thickness8Default: Story = {
  render: () => row(makeGauge({ value: 60, thickness: 8, label: 'Default' })),
};

// h2: Thickness: 16
export const Thickness16: Story = {
  render: () => row(makeGauge({ value: 60, thickness: 16, label: 'Thick' })),
};

// h2: Thickness: 24
export const Thickness24: Story = {
  render: () => row(makeGauge({ value: 60, thickness: 24, label: 'Extra Thick' })),
};

// h2: Thickness Comparison
export const ThicknessComparison: Story = {
  render: () => row(
    makeGauge({ value: 70, thickness: 2, label: '2px' }),
    makeGauge({ value: 70, thickness: 6, label: '6px' }),
    makeGauge({ value: 70, thickness: 12, label: '12px' }),
    makeGauge({ value: 70, thickness: 20, label: '20px' }),
  ),
};

// h2: No Label
export const NoLabel: Story = {
  render: () => row(makeGauge({ value: 80 })),
};

// h2: Variant x Size Matrix
export const VariantXSizeMatrix: Story = {
  render: () => {
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:1.5rem;';
    const combos: [string, string, number, string][] = [
      ['primary', 'small', 30, 'P/S'],
      ['success', 'small', 60, 'S/S'],
      ['warning', 'small', 45, 'W/S'],
      ['error', 'small', 85, 'E/S'],
      ['primary', 'medium', 30, 'P/M'],
      ['success', 'medium', 60, 'S/M'],
      ['warning', 'medium', 45, 'W/M'],
      ['error', 'medium', 85, 'E/M'],
      ['primary', 'large', 30, 'P/L'],
      ['success', 'large', 60, 'S/L'],
      ['warning', 'large', 45, 'W/L'],
      ['error', 'large', 85, 'E/L'],
    ];
    combos.forEach(([variant, size, value, label]) => {
      grid.appendChild(makeGauge({ variant, size, value, label }));
    });
    return grid;
  },
};

// h2: Edge: Value Exceeds Max (clamped to 100)
export const EdgeValueExceedsMax: Story = {
  render: () => row(makeGauge({ value: 150, max: 100, label: 'Clamped' })),
};

// h2: Edge: Value Below Min (clamped to 0)
export const EdgeValueBelowMin: Story = {
  render: () => row(makeGauge({ value: -20, min: 0, max: 100, label: 'Clamped' })),
};

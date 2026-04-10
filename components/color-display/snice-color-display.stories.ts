import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-color-display';

type Args = {
  value?: string;
  format?: 'hex' | 'rgb' | 'hsl';
  swatchSize?: 'small' | 'medium' | 'large';
  label?: string;
  showLabel?: boolean;
  showSwatch?: boolean;
};

const meta: Meta<Args> = {
  title: 'Specialty/ColorDisplay',
  component: 'snice-color-display',
  tags: ['autodocs'],
  argTypes: {
    value:      { control: 'color' },
    format:     { control: 'select', options: ['hex', 'rgb', 'hsl'] },
    swatchSize: { control: 'select', options: ['small', 'medium', 'large'] },
    label:      { control: 'text' },
    showLabel:  { control: 'boolean' },
    showSwatch: { control: 'boolean' },
  },
  render: (args) => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    const el = document.createElement('snice-color-display');
    if (args.value      !== undefined) el.setAttribute('value',       args.value);
    if (args.format     !== undefined) el.setAttribute('format',      args.format);
    if (args.swatchSize !== undefined) el.setAttribute('swatch-size', args.swatchSize);
    if (args.label      !== undefined) el.setAttribute('label',       args.label);
    if (args.showLabel  !== undefined) el.setAttribute('show-label',  String(args.showLabel));
    if (args.showSwatch !== undefined) el.setAttribute('show-swatch', String(args.showSwatch));
    wrap.appendChild(el);
    return wrap;
  },
};
export default meta;

type Story = StoryObj<Args>;

function makeCD(attrs: Record<string, string> = {}) {
  const el = document.createElement('snice-color-display');
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

function grid(...els: HTMLElement[]) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:.75rem;';
  els.forEach(el => wrap.appendChild(el));
  return wrap;
}

function row(...els: HTMLElement[]) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;align-items:center;gap:.75rem;flex-wrap:wrap;';
  els.forEach(el => wrap.appendChild(el));
  return wrap;
}

export const Default: Story = {
  args: { value: '#3b82f6', format: 'hex', swatchSize: 'medium' },
};

// h2: format="hex" (default)
export const FormatHex: Story = {
  render: () => grid(
    makeCD({ value: '#ff0000' }),
    makeCD({ value: '#00ff00' }),
    makeCD({ value: '#0000ff' }),
    makeCD({ value: '#000000' }),
    makeCD({ value: '#ffffff' }),
  ),
};

// h2: format="rgb"
export const FormatRgb: Story = {
  render: () => grid(
    makeCD({ value: '#ff0000', format: 'rgb' }),
    makeCD({ value: '#00ff00', format: 'rgb' }),
    makeCD({ value: '#0000ff', format: 'rgb' }),
  ),
};

// h2: format="hsl"
export const FormatHsl: Story = {
  render: () => grid(
    makeCD({ value: '#ff0000', format: 'hsl' }),
    makeCD({ value: '#00ff00', format: 'hsl' }),
    makeCD({ value: '#0000ff', format: 'hsl' }),
  ),
};

// h2: Same color in all formats
export const SameColorAllFormats: Story = {
  render: () => grid(
    makeCD({ value: '#3b82f6', format: 'hex' }),
    makeCD({ value: '#3b82f6', format: 'rgb' }),
    makeCD({ value: '#3b82f6', format: 'hsl' }),
  ),
};

// h2: swatch-size="small"
export const SwatchSizeSmall: Story = {
  render: () => grid(
    makeCD({ value: '#ef4444', 'swatch-size': 'small' }),
    makeCD({ value: '#10b981', 'swatch-size': 'small' }),
    makeCD({ value: '#6366f1', 'swatch-size': 'small' }),
  ),
};

// h2: swatch-size="medium" (default)
export const SwatchSizeMedium: Story = {
  render: () => grid(
    makeCD({ value: '#ef4444', 'swatch-size': 'medium' }),
    makeCD({ value: '#10b981', 'swatch-size': 'medium' }),
    makeCD({ value: '#6366f1', 'swatch-size': 'medium' }),
  ),
};

// h2: swatch-size="large"
export const SwatchSizeLarge: Story = {
  render: () => grid(
    makeCD({ value: '#ef4444', 'swatch-size': 'large' }),
    makeCD({ value: '#10b981', 'swatch-size': 'large' }),
    makeCD({ value: '#6366f1', 'swatch-size': 'large' }),
  ),
};

// h2: Custom labels
export const CustomLabels: Story = {
  render: () => grid(
    makeCD({ value: '#ef4444', label: 'Error Red' }),
    makeCD({ value: '#10b981', label: 'Success Green' }),
    makeCD({ value: '#f59e0b', label: 'Warning Amber' }),
    makeCD({ value: '#3b82f6', label: 'Info Blue' }),
  ),
};

// h2: show-label="false" (swatch only)
export const ShowLabelFalse: Story = {
  render: () => row(
    makeCD({ value: '#ef4444', 'show-label': 'false', 'swatch-size': 'large' }),
    makeCD({ value: '#f59e0b', 'show-label': 'false', 'swatch-size': 'large' }),
    makeCD({ value: '#10b981', 'show-label': 'false', 'swatch-size': 'large' }),
    makeCD({ value: '#3b82f6', 'show-label': 'false', 'swatch-size': 'large' }),
    makeCD({ value: '#8b5cf6', 'show-label': 'false', 'swatch-size': 'large' }),
  ),
};

// h2: show-swatch="false" (label only)
export const ShowSwatchFalse: Story = {
  render: () => grid(
    makeCD({ value: '#ef4444', 'show-swatch': 'false', format: 'hex' }),
    makeCD({ value: '#10b981', 'show-swatch': 'false', format: 'rgb' }),
    makeCD({ value: '#3b82f6', 'show-swatch': 'false', format: 'hsl' }),
  ),
};

// h2: Edge: empty value
export const EdgeEmptyValue: Story = {
  render: () => makeCD({ value: '' }),
};

// h2: Palette (swatch-size x format combinations)
export const Palette: Story = {
  render: () => grid(
    makeCD({ value: '#f8fafc', label: 'Gray 50',  'swatch-size': 'small' }),
    makeCD({ value: '#e2e8f0', label: 'Gray 200', 'swatch-size': 'medium' }),
    makeCD({ value: '#64748b', label: 'Gray 500', 'swatch-size': 'large' }),
    makeCD({ value: '#1e293b', label: 'Gray 800', 'swatch-size': 'small', format: 'rgb' }),
    makeCD({ value: '#0f172a', label: 'Gray 900', 'swatch-size': 'large', format: 'hsl' }),
  ),
};

import type { Meta, StoryObj } from '@storybook/web-components-vite';
import './snice-sparkline';

type Args = {
  type?: string;
  color?: string;
  width?: number;
  height?: number;
  strokeWidth?: number;
  showDots?: boolean;
  showArea?: boolean;
  smooth?: boolean;
};

const TYPES = ['line', 'bar', 'area'];
const COLORS = ['primary', 'success', 'warning', 'danger', 'muted'];
const DATA = [10, 25, 15, 30, 20, 35, 28, 40, 32, 45];

function makeSpark(props: {
  data?: number[];
  type?: string;
  color?: string;
  customColor?: string;
  width?: number;
  height?: number;
  strokeWidth?: number;
  showDots?: boolean;
  showArea?: boolean;
  smooth?: boolean;
  min?: number;
  max?: number;
}) {
  const el = document.createElement('snice-sparkline');
  (el as any).data = props.data ?? DATA;
  if (props.type) el.setAttribute('type', props.type);
  if (props.color) el.setAttribute('color', props.color);
  if (props.customColor) (el as any).customColor = props.customColor;
  if (props.width) el.setAttribute('width', String(props.width));
  if (props.height) el.setAttribute('height', String(props.height));
  if (props.strokeWidth) (el as any).strokeWidth = props.strokeWidth;
  if (props.showDots) (el as any).showDots = true;
  if (props.showArea) (el as any).showArea = true;
  if (props.smooth) (el as any).smooth = true;
  if (props.min !== undefined) (el as any).min = props.min;
  if (props.max !== undefined) (el as any).max = props.max;
  return el;
}

function row(...els: HTMLElement[]) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;gap:.75rem;flex-wrap:wrap;align-items:center;';
  els.forEach(el => wrap.appendChild(el));
  return wrap;
}

function labelEl(text: string) {
  const el = document.createElement('span');
  el.style.cssText = 'font-size:0.8rem;color:var(--snice-color-text-secondary);min-width:60px;';
  el.textContent = text;
  return el;
}

const meta: Meta<Args> = {
  title: 'Charts/Sparkline',
  component: 'snice-sparkline',
  tags: ['autodocs'],
  argTypes: {
    type: { control: 'select', options: TYPES },
    color: { control: 'select', options: COLORS },
    width: { control: 'number' },
    height: { control: 'number' },
    strokeWidth: { control: 'number' },
    showDots: { control: 'boolean' },
    showArea: { control: 'boolean' },
    smooth: { control: 'boolean' },
  },
  render: (args) => {
    const el = document.createElement('snice-sparkline');
    (el as any).data = DATA;
    if (args.type !== undefined) el.setAttribute('type', String(args.type));
    if (args.color !== undefined) el.setAttribute('color', String(args.color));
    if (args.width !== undefined) el.setAttribute('width', String(args.width));
    if (args.height !== undefined) el.setAttribute('height', String(args.height));
    if (args.strokeWidth !== undefined) (el as any).strokeWidth = args.strokeWidth;
    if (args.showDots) (el as any).showDots = true;
    if (args.showArea) (el as any).showArea = true;
    if (args.smooth) (el as any).smooth = true;
    return el;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = { args: { type: 'line', color: 'primary', width: 100, height: 30 } };

// h2: Types
export const Types: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:1rem;flex-wrap:wrap;align-items:center;';
    TYPES.forEach(t => {
      const item = document.createElement('div');
      item.style.cssText = 'display:flex;align-items:center;gap:0.5rem;';
      item.appendChild(labelEl(t));
      item.appendChild(makeSpark({ type: t }));
      wrap.appendChild(item);
    });
    return wrap;
  },
};

// h2: Colors
export const Colors: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:1rem;flex-wrap:wrap;align-items:center;';
    COLORS.forEach(c => {
      const item = document.createElement('div');
      item.style.cssText = 'display:flex;align-items:center;gap:0.5rem;';
      item.appendChild(labelEl(c));
      item.appendChild(makeSpark({ color: c }));
      wrap.appendChild(item);
    });
    return wrap;
  },
};

// h2: Type x Color Matrix
export const TypeXColorMatrix: Story = {
  render: () => {
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(5,auto);gap:1rem;align-items:center;';
    COLORS.forEach(c => {
      TYPES.forEach(t => {
        grid.appendChild(makeSpark({ type: t, color: c }));
      });
    });
    return grid;
  },
};

// h2: Show Dots
export const ShowDots: Story = {
  render: () => row(makeSpark({ showDots: true }), makeSpark({ showDots: true, color: 'success' })),
};

// h2: Show Area
export const ShowArea: Story = {
  render: () => row(makeSpark({ showArea: true }), makeSpark({ showArea: true, color: 'danger' })),
};

// h2: Smooth
export const Smooth: Story = {
  render: () => row(makeSpark({ smooth: true }), makeSpark({ smooth: true, color: 'warning' })),
};

// h2: Smooth + Show Area
export const SmoothShowArea: Story = {
  render: () => row(
    makeSpark({ smooth: true, showArea: true }),
    makeSpark({ smooth: true, showArea: true, color: 'success' }),
  ),
};

// h2: Smooth + Show Dots
export const SmoothShowDots: Story = {
  render: () => row(
    makeSpark({ smooth: true, showDots: true }),
    makeSpark({ smooth: true, showDots: true, color: 'danger' }),
  ),
};

// h2: Smooth + Show Area + Show Dots
export const SmoothShowAreaShowDots: Story = {
  render: () => row(
    makeSpark({ smooth: true, showArea: true, showDots: true }),
    makeSpark({ smooth: true, showArea: true, showDots: true, color: 'success' }),
  ),
};

// h2: Custom Sizes
export const CustomSizes: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:1rem;flex-wrap:wrap;align-items:center;';
    ([
      [60, 20], [100, 30], [150, 40], [200, 50],
    ] as [number, number][]).forEach(([w, h]) => {
      const item = document.createElement('div');
      item.style.cssText = 'display:flex;align-items:center;gap:0.5rem;';
      item.appendChild(labelEl(`${w}x${h}`));
      item.appendChild(makeSpark({ width: w, height: h }));
      wrap.appendChild(item);
    });
    return wrap;
  },
};

// h2: Custom Stroke Width
export const CustomStrokeWidth: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:1rem;flex-wrap:wrap;align-items:center;';
    [1, 2, 3, 4, 5].forEach(sw => {
      const item = document.createElement('div');
      item.style.cssText = 'display:flex;align-items:center;gap:0.5rem;';
      item.appendChild(labelEl(`stroke=${sw}`));
      item.appendChild(makeSpark({ strokeWidth: sw }));
      wrap.appendChild(item);
    });
    return wrap;
  },
};

// h2: Custom Color
export const CustomColor: Story = {
  render: () => row(
    ...['#ff6b6b', '#51cf66', '#339af0', '#fcc419', '#845ef7'].map(c => makeSpark({ customColor: c })),
  ),
};

// h2: Custom Min/Max
export const CustomMinMax: Story = {
  render: () => row(
    makeSpark({ min: 0, max: 100 }),
    makeSpark({ min: -50, max: 50, data: [-10, 5, -20, 15, -5, 10] }),
  ),
};

// h2: Edge Cases
export const EdgeCases: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:1rem;flex-wrap:wrap;align-items:center;';
    const cases: [string, number[]][] = [
      ['empty', []],
      ['single', [42]],
      ['two', [10, 50]],
      ['flat', [20, 20, 20, 20, 20]],
      ['negative', [-10, 5, -20, 15, -5, 10]],
    ];
    cases.forEach(([name, data]) => {
      const item = document.createElement('div');
      item.style.cssText = 'display:flex;align-items:center;gap:0.5rem;';
      item.appendChild(labelEl(name));
      item.appendChild(makeSpark({ data }));
      wrap.appendChild(item);
    });
    return wrap;
  },
};

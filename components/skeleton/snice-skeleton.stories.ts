import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-skeleton';

type Args = {
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  animation?: 'wave' | 'pulse' | 'none';
  width?: string;
  height?: string;
  count?: number;
  spacing?: string;
};

const VARIANTS = ['text', 'circular', 'rectangular', 'rounded'] as const;
const ANIMATIONS = ['wave', 'pulse', 'none'] as const;

function makeSkeleton(attrs: Record<string, string | number>): HTMLElement {
  const el = document.createElement('snice-skeleton');
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return el;
}

const meta: Meta<Args> = {
  title: 'Data/Skeleton',
  component: 'snice-skeleton',
  tags: ['autodocs'],
  argTypes: {
    variant:   { control: 'select', options: VARIANTS },
    animation: { control: 'select', options: ANIMATIONS },
    width:     { control: 'text' },
    height:    { control: 'text' },
    count:     { control: 'number' },
    spacing:   { control: 'text' },
  },
  render: (args) => {
    const el = document.createElement('snice-skeleton');
    if (args.variant !== undefined)   el.setAttribute('variant', args.variant);
    if (args.animation !== undefined) el.setAttribute('animation', args.animation);
    if (args.width !== undefined)     el.setAttribute('width', args.width);
    if (args.height !== undefined)    el.setAttribute('height', args.height);
    if (args.count !== undefined)     el.setAttribute('count', String(args.count));
    if (args.spacing !== undefined)   el.setAttribute('spacing', args.spacing);
    return el;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {
  args: { variant: 'text', animation: 'wave' },
};

// h2: Variants
export const Variants: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;max-width:400px;';
    for (const v of VARIANTS) {
      const item = document.createElement('div');
      const lbl = document.createElement('span');
      lbl.style.cssText = 'font-size:0.8rem;color:#888;display:block;margin-bottom:0.25rem;';
      lbl.textContent = v;
      item.appendChild(lbl);
      item.appendChild(makeSkeleton({ variant: v }));
      wrap.appendChild(item);
    }
    return wrap;
  },
};

// h2: Animations
export const Animations: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;max-width:400px;';
    for (const a of ANIMATIONS) {
      const item = document.createElement('div');
      const lbl = document.createElement('span');
      lbl.style.cssText = 'font-size:0.8rem;color:#888;display:block;margin-bottom:0.25rem;';
      lbl.textContent = a === 'wave' ? 'wave (default)' : a;
      item.appendChild(lbl);
      item.appendChild(makeSkeleton({ animation: a }));
      wrap.appendChild(item);
    }
    return wrap;
  },
};

// h2: Variant x Animation Matrix
export const VariantXAnimationMatrix: Story = {
  render: () => {
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;max-width:800px;';
    for (const v of VARIANTS) {
      for (const a of ANIMATIONS) {
        grid.appendChild(makeSkeleton({ variant: v, animation: a }));
      }
    }
    return grid;
  },
};

// h2: Custom Width and Height
export const CustomWidthAndHeight: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:0.75rem;flex-wrap:wrap;align-items:center;';
    const combos = [
      { variant: 'text', width: '200px', height: '12px' },
      { variant: 'text', width: '300px', height: '24px' },
      { variant: 'circular', width: '60px', height: '60px' },
      { variant: 'circular', width: '80px', height: '80px' },
      { variant: 'rectangular', width: '150px', height: '80px' },
      { variant: 'rounded', width: '200px', height: '60px' },
    ];
    combos.forEach(c => wrap.appendChild(makeSkeleton(c)));
    return wrap;
  },
};

// h2: Count (Multiple Bones)
export const CountMultipleBones: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'max-width:400px;display:flex;flex-direction:column;gap:1.5rem;';
    for (const count of [1, 3, 5]) {
      const item = document.createElement('div');
      const lbl = document.createElement('span');
      lbl.style.cssText = 'font-size:0.8rem;color:#888;display:block;margin-bottom:0.25rem;';
      lbl.textContent = `count=${count}`;
      item.appendChild(lbl);
      item.appendChild(makeSkeleton({ variant: 'text', count }));
      wrap.appendChild(item);
    }
    return wrap;
  },
};

// h2: Custom Spacing
export const CustomSpacing: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'max-width:400px;display:flex;flex-direction:column;gap:1.5rem;';
    const spacings = ['4px', '8px', '16px', '24px'];
    for (const spacing of spacings) {
      const item = document.createElement('div');
      const lbl = document.createElement('span');
      lbl.style.cssText = 'font-size:0.8rem;color:#888;display:block;margin-bottom:0.25rem;';
      lbl.textContent = spacing === '8px' ? 'spacing=8px (default)' : `spacing=${spacing}`;
      item.appendChild(lbl);
      item.appendChild(makeSkeleton({ variant: 'text', count: 3, spacing }));
      wrap.appendChild(item);
    }
    return wrap;
  },
};

// h2: Card Skeleton Pattern
export const CardSkeletonPattern: Story = {
  render: () => {
    const card = document.createElement('div');
    card.style.cssText = 'max-width:300px;border:1px solid rgba(128,128,128,0.2);border-radius:8px;padding:1rem;';
    card.appendChild(makeSkeleton({ variant: 'rectangular', height: '160px' }));
    const title = document.createElement('div');
    title.style.marginTop = '0.75rem';
    title.appendChild(makeSkeleton({ variant: 'text', width: '80%', height: '20px' }));
    card.appendChild(title);
    const lines = document.createElement('div');
    lines.style.marginTop = '0.5rem';
    lines.appendChild(makeSkeleton({ variant: 'text', count: 2, spacing: '6px' }));
    card.appendChild(lines);
    const footer = document.createElement('div');
    footer.style.cssText = 'margin-top:0.75rem;display:flex;gap:0.5rem;align-items:center;';
    footer.appendChild(makeSkeleton({ variant: 'circular', width: '32px', height: '32px' }));
    footer.appendChild(makeSkeleton({ variant: 'text', width: '100px', height: '14px' }));
    card.appendChild(footer);
    return card;
  },
};

// h2: List Skeleton Pattern
export const ListSkeletonPattern: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'max-width:400px;display:flex;flex-direction:column;gap:1rem;';
    for (const widths of [['60%', '90%'], ['50%', '80%'], ['70%', '85%']]) {
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;gap:0.75rem;align-items:center;';
      row.appendChild(makeSkeleton({ variant: 'circular', width: '40px', height: '40px' }));
      const col = document.createElement('div');
      col.style.flex = '1';
      col.appendChild(makeSkeleton({ variant: 'text', width: widths[0], height: '16px' }));
      const sub = document.createElement('div');
      sub.style.marginTop = '0.25rem';
      sub.appendChild(makeSkeleton({ variant: 'text', width: widths[1], height: '12px' }));
      col.appendChild(sub);
      row.appendChild(col);
      wrap.appendChild(row);
    }
    return wrap;
  },
};

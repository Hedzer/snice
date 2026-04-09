import type { Meta, StoryObj } from '@storybook/web-components-vite';
import './snice-divider';

type Args = {
  variant?: 'solid' | 'dashed' | 'dotted';
  spacing?: 'none' | 'small' | 'medium' | 'large';
  text?: string;
  align?: 'start' | 'center' | 'end';
  orientation?: 'horizontal' | 'vertical';
  color?: string;
  capped?: boolean;
  textBackground?: string;
};

const VARIANTS = ['solid', 'dashed', 'dotted'] as const;
const SPACINGS = ['none', 'small', 'medium', 'large'] as const;

function makeDivider(attrs: Record<string, string | boolean>): HTMLElement {
  const el = document.createElement('snice-divider');
  for (const [k, v] of Object.entries(attrs)) {
    if (typeof v === 'boolean') { if (v) el.toggleAttribute(k, true); }
    else el.setAttribute(k, String(v));
  }
  return el;
}

const meta: Meta<Args> = {
  title: 'Data/Divider',
  component: 'snice-divider',
  tags: ['autodocs'],
  argTypes: {
    variant:        { control: 'select', options: VARIANTS },
    spacing:        { control: 'select', options: SPACINGS },
    text:           { control: 'text' },
    align:          { control: 'select', options: ['start', 'center', 'end'] },
    orientation:    { control: 'select', options: ['horizontal', 'vertical'] },
    color:          { control: 'color' },
    capped:         { control: 'boolean' },
    textBackground: { control: 'color' },
  },
  render: (args) => {
    const el = document.createElement('snice-divider');
    if (args.variant !== undefined)        el.setAttribute('variant', args.variant);
    if (args.spacing !== undefined)        el.setAttribute('spacing', args.spacing);
    if (args.text !== undefined)           el.setAttribute('text', args.text);
    if (args.align !== undefined)          el.setAttribute('align', args.align);
    if (args.orientation !== undefined)    el.setAttribute('orientation', args.orientation);
    if (args.color !== undefined)          el.setAttribute('color', args.color);
    if (args.textBackground !== undefined) el.setAttribute('text-background', args.textBackground);
    if (args.capped) el.toggleAttribute('capped', true);
    return el;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = { args: {} };

// h2: Default (horizontal, solid, medium spacing)
export const DefaultHorizontalSolidMediumSpacing: Story = {
  render: () => makeDivider({}),
};

// h2: All variants
export const AllVariants: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:0.25rem;';
    for (const v of VARIANTS) {
      wrap.appendChild(makeDivider({ variant: v }));
      const lbl = document.createElement('p');
      lbl.style.cssText = 'font-size:0.75rem;color:#888;margin:0 0 0.75rem;';
      lbl.textContent = v;
      wrap.appendChild(lbl);
    }
    return wrap;
  },
};

// h2: All spacing values
export const AllSpacingValues: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;';
    for (const s of SPACINGS) {
      const lbl = document.createElement('p');
      lbl.style.cssText = 'font-size:0.75rem;color:#888;margin:0;';
      lbl.textContent = `${s}:`;
      wrap.appendChild(lbl);
      wrap.appendChild(makeDivider({ spacing: s }));
    }
    return wrap;
  },
};

// h2: With text
export const WithText: Story = {
  render: () => makeDivider({ text: 'OR' }),
};

// h2: Text alignment
export const TextAlignment: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:0.5rem;';
    wrap.appendChild(makeDivider({ text: 'Start', align: 'start' }));
    wrap.appendChild(makeDivider({ text: 'Center', align: 'center' }));
    wrap.appendChild(makeDivider({ text: 'End', align: 'end' }));
    return wrap;
  },
};

// h2: Text x Variants
export const TextXVariants: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:0.5rem;';
    for (const v of VARIANTS) {
      wrap.appendChild(makeDivider({ text: v.charAt(0).toUpperCase() + v.slice(1), variant: v }));
    }
    return wrap;
  },
};

// h2: Text x Spacing
export const TextXSpacing: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;';
    for (const s of SPACINGS) {
      wrap.appendChild(makeDivider({ text: s.charAt(0).toUpperCase() + s.slice(1), spacing: s }));
    }
    return wrap;
  },
};

// h2: Vertical orientation
export const VerticalOrientation: Story = {
  render: () => {
    const container = document.createElement('div');
    container.style.cssText = 'display:flex;align-items:center;height:50px;gap:1rem;';
    const span1 = document.createElement('span');
    span1.textContent = 'Left';
    const span2 = document.createElement('span');
    span2.textContent = 'Center';
    const span3 = document.createElement('span');
    span3.textContent = 'Right';
    container.appendChild(span1);
    container.appendChild(makeDivider({ orientation: 'vertical' }));
    container.appendChild(span2);
    container.appendChild(makeDivider({ orientation: 'vertical' }));
    container.appendChild(span3);
    return container;
  },
};

// h2: Vertical x Variants
export const VerticalXVariants: Story = {
  render: () => {
    const container = document.createElement('div');
    container.style.cssText = 'display:flex;align-items:center;height:50px;gap:1rem;';
    const labels = ['Solid', 'Dashed', 'Dotted', 'End'];
    const variants = ['solid', 'dashed', 'dotted'];
    labels.forEach((label, i) => {
      const span = document.createElement('span');
      span.textContent = label;
      container.appendChild(span);
      if (i < variants.length) {
        container.appendChild(makeDivider({ orientation: 'vertical', variant: variants[i] }));
      }
    });
    return container;
  },
};

// h2: Custom color
export const CustomColor: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:0.5rem;';
    wrap.appendChild(makeDivider({ color: '#3b82f6' }));
    wrap.appendChild(makeDivider({ color: '#ef4444' }));
    wrap.appendChild(makeDivider({ color: '#10b981' }));
    return wrap;
  },
};

// h2: Custom color + text
export const CustomColorText: Story = {
  render: () => makeDivider({ color: '#8b5cf6', text: 'Purple' }),
};

// h2: Capped (rounded ends)
export const CappedRoundedEnds: Story = {
  render: () => makeDivider({ capped: true }),
};

// h2: Capped x Variants
export const CappedXVariants: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:0.5rem;';
    for (const v of VARIANTS) {
      wrap.appendChild(makeDivider({ capped: true, variant: v }));
    }
    return wrap;
  },
};

// h2: text-background (custom bg behind text)
export const TextBackgroundCustomBgBehindText: Story = {
  render: () => makeDivider({ text: 'Custom BG', 'text-background': '#f0f0f0' }),
};

// h2: Long text
export const LongText: Story = {
  render: () => makeDivider({ text: 'This is a very long divider text that might cause layout issues' }),
};

// h2: Single character text
export const SingleCharacterText: Story = {
  render: () => makeDivider({ text: '*' }),
};

// h2: Vertical + custom color
export const VerticalCustomColor: Story = {
  render: () => {
    const container = document.createElement('div');
    container.style.cssText = 'display:flex;align-items:center;height:50px;gap:1rem;';
    const spanA = document.createElement('span');
    spanA.textContent = 'A';
    const spanB = document.createElement('span');
    spanB.textContent = 'B';
    const spanC = document.createElement('span');
    spanC.textContent = 'C';
    container.appendChild(spanA);
    container.appendChild(makeDivider({ orientation: 'vertical', color: '#ef4444' }));
    container.appendChild(spanB);
    container.appendChild(makeDivider({ orientation: 'vertical', color: '#3b82f6' }));
    container.appendChild(spanC);
    return container;
  },
};

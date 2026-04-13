import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-spinner';
import type { SpinnerSize, SpinnerColor } from './snice-spinner.types';

type Args = {
  size?: SpinnerSize;
  color?: SpinnerColor;
  label?: string;
  thickness?: number;
};

const SIZES: SpinnerSize[] = ['small', 'medium', 'large', 'xl'];
const COLORS: SpinnerColor[] = ['primary', 'success', 'warning', 'error', 'info'];

function makeSpinner(attrs: Record<string, string | number> = {}) {
  const el = document.createElement('snice-spinner');
  for (const [k, v] of Object.entries(attrs)) {
    el.setAttribute(k, String(v));
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
  title: 'Feedback/Spinner',
  component: 'snice-spinner',
  tags: ['autodocs'],
  argTypes: {
    size:      { control: 'select', options: SIZES },
    color:     { control: 'select', options: COLORS },
    label:     { control: 'text' },
    thickness: { control: 'number' },
  },
  render: (args) => {
    const el = document.createElement('snice-spinner');
    if (args.size      !== undefined) el.setAttribute('size',      String(args.size));
    if (args.color     !== undefined) el.setAttribute('color',     String(args.color));
    if (args.label     !== undefined) el.setAttribute('label',     String(args.label));
    if (args.thickness !== undefined) el.setAttribute('thickness', String(args.thickness));
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:.75rem;flex-wrap:wrap;align-items:center;';
    wrap.appendChild(el);
    return wrap;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {
  args: { size: 'medium', color: 'primary' },
};

// h2: Sizes
export const Sizes: Story = {
  render: () => row(...SIZES.map(s => makeSpinner({ size: s }))),
};

// h2: Colors
export const Colors: Story = {
  render: () => row(...COLORS.map(c => makeSpinner({ color: c }))),
};

// h2: Size x Color Matrix
export const SizeXColorMatrix: Story = {
  render: () => col(
    ...SIZES.map(s => row(...COLORS.map(c => makeSpinner({ size: s, color: c })))),
  ),
};

// h2: With Label
export const WithLabel: Story = {
  render: () => col(
    makeSpinner({ label: 'Loading...' }),
    makeSpinner({ size: 'large', color: 'primary', label: 'Please wait' }),
    makeSpinner({ size: 'small', color: 'success', label: 'Saving' }),
  ),
};

// h2: Custom Thickness
export const CustomThickness: Story = {
  render: () => row(
    makeSpinner({ thickness: 2, label: 'thin' }),
    makeSpinner({ thickness: 4, label: 'default' }),
    makeSpinner({ thickness: 8, label: 'thick' }),
    makeSpinner({ thickness: 12, label: 'extra' }),
  ),
};

// h2: Thickness x Size
export const ThicknessXSize: Story = {
  render: () => col(
    ...([2, 4, 8] as number[]).map(t => row(...SIZES.map(s => makeSpinner({ size: s, thickness: t })))),
  ),
};

// h2: No Label (default)
export const NoLabel: Story = {
  render: () => row(...SIZES.map(s => makeSpinner({ size: s }))),
};

// h2: On Dark Background
export const OnDarkBackground: Story = {
  render: () => {
    const bg = document.createElement('div');
    bg.style.cssText = 'background:#1a1a2e;padding:1.5rem;border-radius:8px;display:flex;gap:1.5rem;align-items:center;';
    SIZES.forEach(s => bg.appendChild(makeSpinner({ size: s, color: 'primary' })));
    return bg;
  },
};

// h2: CSS Parts Styling
// Parts: base, circle, label
export const CSSPartsStyling: Story = {
  render: () => {
    const style = document.createElement('style');
    style.textContent = `
      /* snice-spinner exposes the following CSS parts:
         ::part(base)   — the root spinner wrapper div
         ::part(circle) — the SVG arc element
         ::part(label)  — the loading label text span */
      .parts-demo .styled-spinner::part(base) {
        background: rgba(251,191,36,.08);
        border-radius: 50%;
        padding: 8px;
        box-shadow: 0 0 16px rgba(251,191,36,.3);
      }
      .parts-demo .styled-spinner::part(circle) {
        stroke: #fbbf24;
        filter: drop-shadow(0 0 4px #fbbf24);
      }
      .parts-demo .styled-spinner::part(label) {
        color: #fbbf24;
        font-weight: 700;
        font-size: .8rem;
        letter-spacing: .05em;
        text-transform: uppercase;
      }
    `;

    const wrap = document.createElement('div');
    wrap.className = 'parts-demo';
    wrap.style.cssText = 'display:flex;gap:3rem;align-items:center;flex-wrap:wrap;';

    const col1 = document.createElement('div');
    col1.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:.5rem;';
    const lbl1 = document.createElement('p');
    lbl1.textContent = 'Default';
    lbl1.style.cssText = 'margin:0;font-size:.75rem;opacity:.6;';
    const defaultSpinner = makeSpinner({ size: 'large', label: 'Loading...' });
    col1.appendChild(lbl1);
    col1.appendChild(defaultSpinner);

    const col2 = document.createElement('div');
    col2.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:.5rem;';
    const lbl2 = document.createElement('p');
    lbl2.textContent = 'Styled ::part(base/circle/label)';
    lbl2.style.cssText = 'margin:0;font-size:.75rem;opacity:.6;';
    const styledSpinner = makeSpinner({ size: 'large', label: 'Loading...' });
    styledSpinner.className = 'styled-spinner';
    col2.appendChild(lbl2);
    col2.appendChild(styledSpinner);

    wrap.appendChild(style);
    wrap.appendChild(col1);
    wrap.appendChild(col2);
    return wrap;
  },
};

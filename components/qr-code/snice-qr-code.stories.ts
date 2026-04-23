import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-qr-code';

type Args = {
  value?: string;
  renderMode?: 'canvas' | 'svg';
  dotStyle?: 'square' | 'rounded' | 'dots';
  errorCorrection?: 'L' | 'M' | 'Q' | 'H';
  size?: number;
  fgColor?: string;
  bgColor?: string;
  margin?: number;
  centerText?: string;
};

const DEFAULT_VALUE = 'https://snice.dev';

function makeQr(attrs: Record<string, string | number> = {}) {
  const el = document.createElement('snice-qr-code');
  if (!attrs.value) el.setAttribute('value', DEFAULT_VALUE);
  for (const [k, v] of Object.entries(attrs)) {
    el.setAttribute(k, String(v));
  }
  return el;
}

function row(...els: HTMLElement[]) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;gap:1rem;flex-wrap:wrap;align-items:flex-start;';
  els.forEach(el => wrap.appendChild(el));
  return wrap;
}

const meta: Meta<Args> = {
  title: 'QrCode',
  component: 'snice-qr-code',
  tags: ['autodocs'],
  argTypes: {
    value:          { control: 'text' },
    renderMode:     { control: 'select', options: ['canvas', 'svg'] },
    dotStyle:       { control: 'select', options: ['square', 'rounded', 'dots'] },
    errorCorrection:{ control: 'select', options: ['L', 'M', 'Q', 'H'] },
    size:           { control: 'number' },
    fgColor:        { control: 'color' },
    bgColor:        { control: 'color' },
    margin:         { control: 'number' },
    centerText:     { control: 'text' },
  },
  render: (args) => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:1rem;flex-wrap:wrap;';
    const el = document.createElement('snice-qr-code');
    el.setAttribute('value', args.value ?? DEFAULT_VALUE);
    if (args.renderMode !== undefined) el.setAttribute('render-mode', args.renderMode);
    if (args.dotStyle !== undefined) el.setAttribute('dot-style', args.dotStyle);
    if (args.errorCorrection !== undefined) el.setAttribute('error-correction', args.errorCorrection);
    if (args.size !== undefined) el.setAttribute('size', String(args.size));
    if (args.fgColor !== undefined) el.setAttribute('fg-color', args.fgColor);
    if (args.bgColor !== undefined) el.setAttribute('bg-color', args.bgColor);
    if (args.margin !== undefined) el.setAttribute('margin', String(args.margin));
    if (args.centerText !== undefined) el.setAttribute('center-text', args.centerText);
    wrap.appendChild(el);
    return wrap;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = { args: { value: DEFAULT_VALUE, renderMode: 'canvas', dotStyle: 'square' } };

// h2: Default (canvas, square dots)
export const DefaultCanvasSquare: Story = {
  render: () => row(makeQr({ value: DEFAULT_VALUE })),
};

// h2: Render mode: canvas
export const RenderModeCanvas: Story = {
  render: () => row(makeQr({ value: DEFAULT_VALUE, 'render-mode': 'canvas' })),
};

// h2: Render mode: svg
export const RenderModeSvg: Story = {
  render: () => row(makeQr({ value: DEFAULT_VALUE, 'render-mode': 'svg' })),
};

// h2: Dot style: square (default)
export const DotStyleSquare: Story = {
  render: () => row(makeQr({ value: DEFAULT_VALUE, 'dot-style': 'square' })),
};

// h2: Dot style: rounded
export const DotStyleRounded: Story = {
  render: () => row(makeQr({ value: DEFAULT_VALUE, 'dot-style': 'rounded' })),
};

// h2: Dot style: dots
export const DotStyleDots: Story = {
  render: () => row(makeQr({ value: DEFAULT_VALUE, 'dot-style': 'dots' })),
};

// h2: All dot styles side by side
export const AllDotStyles: Story = {
  render: () => row(
    makeQr({ value: DEFAULT_VALUE, 'dot-style': 'square' }),
    makeQr({ value: DEFAULT_VALUE, 'dot-style': 'rounded' }),
    makeQr({ value: DEFAULT_VALUE, 'dot-style': 'dots' }),
  ),
};

// h2: Error correction: L
export const ErrorCorrectionL: Story = {
  render: () => row(makeQr({ value: DEFAULT_VALUE, 'error-correction': 'L' })),
};

// h2: Error correction: M (default)
export const ErrorCorrectionM: Story = {
  render: () => row(makeQr({ value: DEFAULT_VALUE, 'error-correction': 'M' })),
};

// h2: Error correction: Q
export const ErrorCorrectionQ: Story = {
  render: () => row(makeQr({ value: DEFAULT_VALUE, 'error-correction': 'Q' })),
};

// h2: Error correction: H
export const ErrorCorrectionH: Story = {
  render: () => row(makeQr({ value: DEFAULT_VALUE, 'error-correction': 'H' })),
};

// h2: Size: 100
export const Size100: Story = {
  render: () => row(makeQr({ value: DEFAULT_VALUE, size: 100 })),
};

// h2: Size: 200
export const Size200: Story = {
  render: () => row(makeQr({ value: DEFAULT_VALUE, size: 200 })),
};

// h2: Size: 300
export const Size300: Story = {
  render: () => row(makeQr({ value: DEFAULT_VALUE, size: 300 })),
};

// h2: Custom fg-color / bg-color
export const CustomColors: Story = {
  render: () => row(
    makeQr({ value: DEFAULT_VALUE, 'fg-color': '#1a73e8', 'bg-color': '#f8f9fa' }),
    makeQr({ value: DEFAULT_VALUE, 'fg-color': '#ffffff', 'bg-color': '#000000' }),
    makeQr({ value: DEFAULT_VALUE, 'fg-color': '#2e7d32', 'bg-color': '#e8f5e9' }),
  ),
};

// h2: Margin: 0
export const Margin0: Story = {
  render: () => row(makeQr({ value: DEFAULT_VALUE, margin: 0 })),
};

// h2: Margin: 4 (default)
export const Margin4Default: Story = {
  render: () => row(makeQr({ value: DEFAULT_VALUE, margin: 4 })),
};

// h2: Margin: 10
export const Margin10: Story = {
  render: () => row(makeQr({ value: DEFAULT_VALUE, margin: 10 })),
};

// h2: Center text
export const CenterText: Story = {
  render: () => row(makeQr({ value: DEFAULT_VALUE, 'center-text': 'Snice', 'error-correction': 'H', size: 200 })),
};

// h2: Center text with custom colors
export const CenterTextWithCustomColors: Story = {
  render: () => row(makeQr({ value: DEFAULT_VALUE, 'center-text': 'QR', 'fg-color': '#1a73e8', 'bg-color': '#e8f0fe', 'error-correction': 'H', size: 200 })),
};

// h2: Data formats: URL, Email, Phone, WiFi, Geo
export const DataFormats: Story = {
  render: () => row(
    makeQr({ value: 'https://snice.dev', size: 160 }),
    makeQr({ value: 'mailto:hello@snice.dev', size: 160 }),
    makeQr({ value: 'tel:+15550001234', size: 160 }),
    makeQr({ value: 'WIFI:T:WPA;S:MyNetwork;P:password123;;', size: 160 }),
    makeQr({ value: 'geo:37.7749,-122.4194', size: 160 }),
  ),
};

// h2: Long text content
export const LongTextContent: Story = {
  render: () => row(makeQr({ value: 'This is a long text content string that tests how the QR code component handles larger amounts of data and still renders a valid scannable code.', 'error-correction': 'M', size: 250 })),
};

// h2: Empty value
export const EmptyValue: Story = {
  render: () => row(makeQr({ value: '' })),
};

// h2: CSS Parts Styling
// Available parts: base
export const CSSPartsStyling: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:2rem;';

    const style = document.createElement('style');
    style.textContent = `
      .parts-demo-qr-default snice-qr-code {}
      .parts-demo-qr-styled snice-qr-code::part(base) {
        background: #1e1b4b;
        border: 3px solid #818cf8;
        border-radius: 16px;
        padding: 16px;
        box-shadow: 0 0 0 6px rgba(129,140,248,0.2), 0 8px 32px rgba(129,140,248,0.15);
      }
    `;
    wrap.appendChild(style);

    function section(title: string, className: string, ...els: HTMLElement[]) {
      const sec = document.createElement('div');
      sec.className = className;
      const h = document.createElement('div');
      h.style.cssText = 'font-size:.7rem;color:#888;margin-bottom:.5rem;font-family:monospace;';
      h.textContent = title;
      sec.appendChild(h);
      const row2 = document.createElement('div');
      row2.style.cssText = 'display:flex;gap:1rem;flex-wrap:wrap;align-items:flex-start;';
      els.forEach(el => row2.appendChild(el));
      sec.appendChild(row2);
      return sec;
    }

    const defaultEl = makeQr({ value: DEFAULT_VALUE, size: 180 });
    wrap.appendChild(section('Default (no ::part() styles)', 'parts-demo-qr-default', defaultEl));

    const styledEl = makeQr({ value: DEFAULT_VALUE, size: 180 });
    wrap.appendChild(section(
      'Styled: ::part(base) — dark indigo bg + indigo border + glow ring',
      'parts-demo-qr-styled',
      styledEl,
    ));

    return wrap;
  },
};

// h2: Dot style x Render mode matrix
export const DotStyleXRenderModeMatrix: Story = {
  render: () => {
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(3,auto);gap:.5rem;align-items:center;';
    for (const renderMode of ['canvas', 'svg']) {
      for (const dotStyle of ['square', 'rounded', 'dots']) {
        grid.appendChild(makeQr({ value: DEFAULT_VALUE, 'render-mode': renderMode, 'dot-style': dotStyle, size: 120 }));
      }
    }
    return grid;
  },
};

import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-cropper';

type Args = {
  src?: string;
  aspectRatio?: number;
  outputType?: 'png' | 'jpeg' | 'webp';
  minWidth?: number;
  minHeight?: number;
};

const DEMO_SRC = 'https://picsum.photos/seed/crop1/600/400';

function makeCropper(attrs: Record<string, string | number> = {}) {
  const el = document.createElement('snice-cropper');
  el.style.cssText = 'display:block;width:400px;height:300px;';
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
  title: 'Media/Cropper',
  component: 'snice-cropper',
  tags: ['autodocs'],
  argTypes: {
    src:         { control: 'text' },
    aspectRatio: { control: 'number' },
    outputType:  { control: 'select', options: ['png', 'jpeg', 'webp'] },
    minWidth:    { control: 'number' },
    minHeight:   { control: 'number' },
  },
  render: (args) => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:1rem;flex-wrap:wrap;';
    const el = document.createElement('snice-cropper');
    el.style.cssText = 'display:block;width:400px;height:300px;';
    if (args.src !== undefined) el.setAttribute('src', args.src);
    if (args.aspectRatio !== undefined) el.setAttribute('aspect-ratio', String(args.aspectRatio));
    if (args.outputType !== undefined) el.setAttribute('output-type', args.outputType);
    if (args.minWidth !== undefined) el.setAttribute('min-width', String(args.minWidth));
    if (args.minHeight !== undefined) el.setAttribute('min-height', String(args.minHeight));
    wrap.appendChild(el);
    return wrap;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = { args: { src: DEMO_SRC, outputType: 'png' } };

// h2: Default (free form, output-type="png")
export const DefaultFreeForm: Story = {
  render: () => row(makeCropper({ src: DEMO_SRC })),
};

// h2: aspect-ratio="1" (square)
export const AspectRatio1Square: Story = {
  render: () => row(makeCropper({ src: 'https://picsum.photos/seed/crop2/600/400', 'aspect-ratio': 1 })),
};

// h2: aspect-ratio="1.777" (16:9)
export const AspectRatio1777_16x9: Story = {
  render: () => row(makeCropper({ src: 'https://picsum.photos/seed/crop3/600/400', 'aspect-ratio': 1.777 })),
};

// h2: aspect-ratio="0.75" (3:4 portrait)
export const AspectRatio075Portrait: Story = {
  render: () => row(makeCropper({ src: 'https://picsum.photos/seed/crop4/600/400', 'aspect-ratio': 0.75 })),
};

// h2: Aspect ratio grid
export const AspectRatioGrid: Story = {
  render: () => {
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(2,400px);gap:1rem;';
    const ratios: [string, number | undefined][] = [
      ['free', undefined],
      ['1:1', 1],
      ['4:3', 1.333],
      ['16:9', 1.777],
    ];
    ratios.forEach(([label, ratio], i) => {
      const wrapper = document.createElement('div');
      const lbl = document.createElement('div');
      lbl.style.cssText = 'font-size:.7rem;color:#888;margin-bottom:.25rem;';
      lbl.textContent = label;
      const attrs: Record<string, string | number> = { src: `https://picsum.photos/seed/cg${i + 1}/400/300` };
      if (ratio !== undefined) attrs['aspect-ratio'] = ratio;
      const el = makeCropper(attrs);
      wrapper.appendChild(lbl);
      wrapper.appendChild(el);
      grid.appendChild(wrapper);
    });
    return grid;
  },
};

// h2: output-type="jpeg"
export const OutputTypeJpeg: Story = {
  render: () => row(makeCropper({ src: 'https://picsum.photos/seed/crop5/600/400', 'output-type': 'jpeg' })),
};

// h2: output-type="webp"
export const OutputTypeWebp: Story = {
  render: () => row(makeCropper({ src: 'https://picsum.photos/seed/crop6/600/400', 'output-type': 'webp' })),
};

// h2: min-width="100" min-height="100"
export const MinDimensions: Story = {
  render: () => row(makeCropper({ src: 'https://picsum.photos/seed/crop7/600/400', 'min-width': 100, 'min-height': 100 })),
};

// h2: No src (empty)
export const NoSrc: Story = {
  render: () => row(makeCropper({})),
};

// h2: CSS Parts Styling
// Available parts: base, image-container, crop-area
export const CSSPartsStyling: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:2rem;';

    const style = document.createElement('style');
    style.textContent = `
      .parts-demo-cropper-default snice-cropper { display:block;width:400px;height:300px; }
      .parts-demo-cropper-styled snice-cropper { display:block;width:400px;height:300px; }
      .parts-demo-cropper-styled snice-cropper::part(base) {
        border: 3px solid #f59e0b;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 20px rgba(245,158,11,0.25);
      }
      .parts-demo-cropper-styled snice-cropper::part(image-container) {
        background: #1c1917;
      }
      .parts-demo-cropper-styled snice-cropper::part(crop-area) {
        border: 2px dashed #f59e0b;
        box-shadow: 0 0 0 9999px rgba(0,0,0,0.6);
      }
    `;
    wrap.appendChild(style);

    function section(title: string, className: string, el: HTMLElement) {
      const sec = document.createElement('div');
      sec.className = className;
      const h = document.createElement('div');
      h.style.cssText = 'font-size:.7rem;color:#888;margin-bottom:.5rem;font-family:monospace;';
      h.textContent = title;
      sec.appendChild(h);
      sec.appendChild(el);
      return sec;
    }

    const IMG = 'https://picsum.photos/seed/cropparts/600/400';

    const defaultEl = document.createElement('snice-cropper');
    defaultEl.setAttribute('src', IMG);
    wrap.appendChild(section('Default (no ::part() styles)', 'parts-demo-cropper-default', defaultEl));

    const styledEl = document.createElement('snice-cropper');
    styledEl.setAttribute('src', IMG);
    wrap.appendChild(section(
      'Styled: ::part(base) — amber border  |  ::part(image-container) — dark bg  |  ::part(crop-area) — dashed amber frame',
      'parts-demo-cropper-styled',
      styledEl,
    ));

    return wrap;
  },
};

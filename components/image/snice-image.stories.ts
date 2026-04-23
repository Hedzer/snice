import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-image';

type Args = {
  src?: string;
  alt?: string;
  variant?: 'rounded' | 'square' | 'circle';
  size?: 'small' | 'medium' | 'large';
  fit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  lazy?: boolean;
  fallback?: string;
  placeholder?: string;
  width?: string;
  height?: string;
};

const VARIANTS = ['rounded', 'square', 'circle'] as const;
const SIZES = ['small', 'medium', 'large'] as const;
const FITS = ['cover', 'contain', 'fill', 'none', 'scale-down'] as const;

function makeImg(attrs: Record<string, string | boolean>): HTMLElement {
  const el = document.createElement('snice-image');
  for (const [k, v] of Object.entries(attrs)) {
    if (typeof v === 'boolean') { if (v) el.toggleAttribute(k, true); }
    else el.setAttribute(k, String(v));
  }
  return el;
}

function row(...els: HTMLElement[]): HTMLElement {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;align-items:flex-start;gap:1.5rem;flex-wrap:wrap;';
  els.forEach(el => wrap.appendChild(el));
  return wrap;
}

const meta: Meta<Args> = {
  title: 'Image',
  component: 'snice-image',
  tags: ['autodocs'],
  argTypes: {
    src:         { control: 'text' },
    alt:         { control: 'text' },
    variant:     { control: 'select', options: VARIANTS },
    size:        { control: 'select', options: SIZES },
    fit:         { control: 'select', options: FITS },
    lazy:        { control: 'boolean' },
    fallback:    { control: 'text' },
    placeholder: { control: 'text' },
    width:       { control: 'text' },
    height:      { control: 'text' },
  },
  render: (args) => {
    const el = document.createElement('snice-image');
    if (args.src !== undefined)         el.setAttribute('src', args.src);
    if (args.alt !== undefined)         el.setAttribute('alt', args.alt);
    if (args.variant !== undefined)     el.setAttribute('variant', args.variant);
    if (args.size !== undefined)        el.setAttribute('size', args.size);
    if (args.fit !== undefined)         el.setAttribute('fit', args.fit);
    if (args.fallback !== undefined)    el.setAttribute('fallback', args.fallback);
    if (args.placeholder !== undefined) el.setAttribute('placeholder', args.placeholder);
    if (args.width !== undefined)       el.setAttribute('width', args.width);
    if (args.height !== undefined)      el.setAttribute('height', args.height);
    if (args.lazy !== undefined) el.setAttribute('lazy', String(args.lazy));
    return el;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {
  args: { src: 'https://picsum.photos/seed/a/300/200', alt: 'Default image', variant: 'rounded', size: 'medium' },
};

// h2: Variant: rounded (default)
export const VariantRoundedDefault: Story = {
  render: () => row(makeImg({ src: 'https://picsum.photos/seed/a/300/200', alt: 'Rounded image', variant: 'rounded' })),
};

// h2: Variant: square
export const VariantSquare: Story = {
  render: () => row(makeImg({ src: 'https://picsum.photos/seed/b/300/200', alt: 'Square image', variant: 'square' })),
};

// h2: Variant: circle
export const VariantCircle: Story = {
  render: () => row(makeImg({ src: 'https://picsum.photos/seed/c/200/200', alt: 'Circle image', variant: 'circle' })),
};

// h2: All Variants Compared
export const AllVariantsCompared: Story = {
  render: () => row(
    makeImg({ src: 'https://picsum.photos/seed/d/200/200', alt: 'Rounded', variant: 'rounded', size: 'medium' }),
    makeImg({ src: 'https://picsum.photos/seed/e/200/200', alt: 'Square', variant: 'square', size: 'medium' }),
    makeImg({ src: 'https://picsum.photos/seed/f/200/200', alt: 'Circle', variant: 'circle', size: 'medium' }),
  ),
};

// h2: Size: small
export const SizeSmall: Story = {
  render: () => row(makeImg({ src: 'https://picsum.photos/seed/g/150/150', alt: 'Small', size: 'small' })),
};

// h2: Size: medium (default)
export const SizeMediumDefault: Story = {
  render: () => row(makeImg({ src: 'https://picsum.photos/seed/h/300/200', alt: 'Medium', size: 'medium' })),
};

// h2: Size: large
export const SizeLarge: Story = {
  render: () => row(makeImg({ src: 'https://picsum.photos/seed/i/500/300', alt: 'Large', size: 'large' })),
};

// h2: All Sizes Compared
export const AllSizesCompared: Story = {
  render: () => row(
    makeImg({ src: 'https://picsum.photos/seed/j/200/200', alt: 'Small', size: 'small' }),
    makeImg({ src: 'https://picsum.photos/seed/k/200/200', alt: 'Medium', size: 'medium' }),
    makeImg({ src: 'https://picsum.photos/seed/l/200/200', alt: 'Large', size: 'large' }),
  ),
};

// h2: Fit: cover (default)
export const FitCoverDefault: Story = {
  render: () => row(makeImg({ src: 'https://picsum.photos/seed/m/400/200', alt: 'Cover', fit: 'cover', width: '200px', height: '150px' })),
};

// h2: Fit: contain
export const FitContain: Story = {
  render: () => row(makeImg({ src: 'https://picsum.photos/seed/n/400/200', alt: 'Contain', fit: 'contain', width: '200px', height: '150px' })),
};

// h2: Fit: fill
export const FitFill: Story = {
  render: () => row(makeImg({ src: 'https://picsum.photos/seed/o/400/200', alt: 'Fill', fit: 'fill', width: '200px', height: '150px' })),
};

// h2: Fit: none
export const FitNone: Story = {
  render: () => row(makeImg({ src: 'https://picsum.photos/seed/p/400/200', alt: 'None', fit: 'none', width: '200px', height: '150px' })),
};

// h2: Fit: scale-down
export const FitScaleDown: Story = {
  render: () => row(makeImg({ src: 'https://picsum.photos/seed/q/400/200', alt: 'Scale-down', fit: 'scale-down', width: '200px', height: '150px' })),
};

// h2: All Fit Values Compared (fixed 200x150)
export const AllFitValuesComparedFixed200x150: Story = {
  render: () => row(
    makeImg({ src: 'https://picsum.photos/seed/r/400/200', alt: 'cover', fit: 'cover', width: '200px', height: '150px' }),
    makeImg({ src: 'https://picsum.photos/seed/s/400/200', alt: 'contain', fit: 'contain', width: '200px', height: '150px' }),
    makeImg({ src: 'https://picsum.photos/seed/t/400/200', alt: 'fill', fit: 'fill', width: '200px', height: '150px' }),
    makeImg({ src: 'https://picsum.photos/seed/u/400/200', alt: 'none', fit: 'none', width: '200px', height: '150px' }),
    makeImg({ src: 'https://picsum.photos/seed/v/400/200', alt: 'scale-down', fit: 'scale-down', width: '200px', height: '150px' }),
  ),
};

// h2: Lazy: true (default)
export const LazyTrueDefault: Story = {
  render: () => row(makeImg({ src: 'https://picsum.photos/seed/w/300/200', alt: 'Lazy', lazy: true })),
};

// h2: Lazy: false (eager)
export const LazyFalseEager: Story = {
  render: () => row(makeImg({ src: 'https://picsum.photos/seed/x/300/200', alt: 'Eager', lazy: 'false' as any })),
};

// h2: Fallback Image (broken src)
export const FallbackImageBrokenSrc: Story = {
  render: () => row(makeImg({
    src: 'https://broken-url.invalid/image.jpg',
    fallback: 'https://picsum.photos/seed/fallback/200/200',
    alt: 'With fallback',
  })),
};

// h2: Placeholder (low-res blur-up)
export const PlaceholderLowResBlurUp: Story = {
  render: () => row(makeImg({
    src: 'https://picsum.photos/seed/z/600/400',
    placeholder: 'https://picsum.photos/seed/z/30/20',
    alt: 'With placeholder',
    size: 'large',
  })),
};

// h2: Custom Width and Height
export const CustomWidthAndHeight: Story = {
  render: () => row(
    makeImg({ src: 'https://picsum.photos/seed/aa/300/300', alt: '100x100', width: '100px', height: '100px' }),
    makeImg({ src: 'https://picsum.photos/seed/bb/300/300', alt: '250x150', width: '250px', height: '150px' }),
    makeImg({ src: 'https://picsum.photos/seed/cc/300/300', alt: '150x250', width: '150px', height: '250px' }),
  ),
};

// h2: No src (empty placeholder)
export const NoSrcEmptyPlaceholder: Story = {
  render: () => row(makeImg({ alt: 'No source provided' })),
};

// h2: Variant x Size Matrix
export const VariantXSizeMatrix: Story = {
  render: () => {
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:1.5rem;';
    const combos = [
      { seed: '1', variant: 'rounded', size: 'small', alt: 'R/S' },
      { seed: '2', variant: 'square', size: 'small', alt: 'S/S' },
      { seed: '3', variant: 'circle', size: 'small', alt: 'C/S' },
      { seed: '4', variant: 'rounded', size: 'medium', alt: 'R/M' },
      { seed: '5', variant: 'square', size: 'medium', alt: 'S/M' },
      { seed: '6', variant: 'circle', size: 'medium', alt: 'C/M' },
    ];
    combos.forEach(c => {
      grid.appendChild(makeImg({ src: `https://picsum.photos/seed/${c.seed}/150/150`, variant: c.variant, size: c.size, alt: c.alt }));
    });
    return grid;
  },
};

// h2: Circle + Contain (fixed size)
export const CircleContainFixedSize: Story = {
  render: () => row(
    makeImg({ src: 'https://picsum.photos/seed/dd/400/200', variant: 'circle', fit: 'contain', width: '150px', height: '150px', alt: 'Circle contain' }),
    makeImg({ src: 'https://picsum.photos/seed/ee/400/200', variant: 'circle', fit: 'cover', width: '150px', height: '150px', alt: 'Circle cover' }),
  ),
};

// h2: CSS Parts Styling
// Parts available: container, placeholder, image
export const CSSPartsStyling: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'img-parts-demo';

    const style = document.createElement('style');
    style.textContent = `
      .img-parts-demo { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 2rem; }
      .img-parts-demo .demo-label {
        font-size: 0.7rem; font-weight: 600; text-transform: uppercase;
        letter-spacing: 0.06em; color: #888; margin-bottom: 0.5rem;
      }
      .img-parts-demo .demo-box { display: flex; flex-direction: column; gap: 0.5rem; }

      /* Styled image parts */
      .img-parts-demo .styled-img::part(container) {
        border: 3px solid #f59e0b;
        border-radius: 16px;
        box-shadow: 0 4px 20px rgba(245, 158, 11, 0.4);
        overflow: hidden;
      }
      .img-parts-demo .styled-img::part(image) {
        filter: saturate(1.4) contrast(1.1);
        transition: filter 0.3s, transform 0.3s;
      }
      .img-parts-demo .styled-img::part(image):hover {
        filter: saturate(1.8) brightness(1.1);
        transform: scale(1.05);
      }

      /* Styled placeholder parts */
      .img-parts-demo .styled-placeholder::part(container) {
        border: 2px dashed #6366f1;
        border-radius: 12px;
        overflow: hidden;
      }
      .img-parts-demo .styled-placeholder::part(placeholder) {
        background: linear-gradient(135deg, #1e1b4b, #312e81, #3730a3);
        animation: custom-pulse 1.5s ease-in-out infinite;
      }
      @keyframes custom-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
    `;
    wrap.appendChild(style);

    const box1 = document.createElement('div');
    box1.className = 'demo-box';
    const lbl1 = document.createElement('div');
    lbl1.className = 'demo-label';
    lbl1.textContent = 'Default (no ::part() styles)';
    box1.appendChild(lbl1);
    box1.appendChild(makeImg({ src: 'https://picsum.photos/seed/img1/300/200', variant: 'rounded', width: '280px', height: '180px', alt: 'Default image' }));
    wrap.appendChild(box1);

    const box2 = document.createElement('div');
    box2.className = 'demo-box';
    const lbl2 = document.createElement('div');
    lbl2.className = 'demo-label';
    lbl2.textContent = 'Styled via ::part() — container, image (hover for effect)';
    box2.appendChild(lbl2);
    const styledImg = makeImg({ src: 'https://picsum.photos/seed/img2/300/200', variant: 'square', width: '280px', height: '180px', alt: 'Styled image' });
    styledImg.classList.add('styled-img');
    box2.appendChild(styledImg);
    wrap.appendChild(box2);

    const box3 = document.createElement('div');
    box3.className = 'demo-box';
    const lbl3 = document.createElement('div');
    lbl3.className = 'demo-label';
    lbl3.textContent = 'Styled placeholder via ::part(placeholder)';
    box3.appendChild(lbl3);
    const placeholderImg = makeImg({ variant: 'rounded', width: '280px', height: '180px', alt: 'Placeholder' });
    placeholderImg.classList.add('styled-placeholder');
    box3.appendChild(placeholderImg);
    wrap.appendChild(box3);

    return wrap;
  },
};

import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-rating';
import type { RatingPrecision, RatingSize } from './snice-rating.types';

type Args = {
  value?: number;
  max?: number;
  icon?: string;
  size?: RatingSize;
  readonly?: boolean;
  precision?: RatingPrecision;
};

const SIZES: RatingSize[] = ['small', 'medium', 'large'];
const PRECISIONS: RatingPrecision[] = ['full', 'half'];

function makeRating(attrs: Record<string, string | number | boolean> = {}) {
  const el = document.createElement('snice-rating');
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
  wrap.style.cssText = 'display:flex;flex-direction:column;gap:.75rem;align-items:flex-start;';
  els.forEach(el => wrap.appendChild(el));
  return wrap;
}

const meta: Meta<Args> = {
  title: 'Feedback/Rating',
  component: 'snice-rating',
  tags: ['autodocs'],
  argTypes: {
    value:     { control: 'number' },
    max:       { control: 'number' },
    icon:      { control: 'text' },
    size:      { control: 'select', options: SIZES },
    readonly:  { control: 'boolean' },
    precision: { control: 'select', options: PRECISIONS },
  },
  render: (args) => {
    const el = document.createElement('snice-rating');
    if (args.value     !== undefined) el.setAttribute('value',     String(args.value));
    if (args.max       !== undefined) el.setAttribute('max',       String(args.max));
    if (args.icon      !== undefined) el.setAttribute('icon',      String(args.icon));
    if (args.size      !== undefined) el.setAttribute('size',      String(args.size));
    if (args.precision !== undefined) el.setAttribute('precision', String(args.precision));
    if (args.readonly) el.toggleAttribute('readonly', true);
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:.75rem;flex-wrap:wrap;align-items:center;';
    wrap.appendChild(el);
    return wrap;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {
  args: { value: 3.5, max: 5, size: 'medium', precision: 'half' },
};

// h2: Values: 0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5
export const Values: Story = {
  render: () => col(
    ...[0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map(v =>
      makeRating({ value: v, max: 5, precision: 'half', readonly: true }),
    ),
  ),
};

// h2: Size: small
export const SizeSmall: Story = {
  render: () => row(makeRating({ value: 3, max: 5, size: 'small' })),
};

// h2: Size: medium (default)
export const SizeMedium: Story = {
  render: () => row(makeRating({ value: 3, max: 5, size: 'medium' })),
};

// h2: Size: large
export const SizeLarge: Story = {
  render: () => row(makeRating({ value: 3, max: 5, size: 'large' })),
};

// h2: All sizes
export const AllSizes: Story = {
  render: () => col(
    ...SIZES.map(s => makeRating({ value: 3.5, max: 5, size: s, precision: 'half' })),
  ),
};

// h2: Precision: full (default)
export const PrecisionFull: Story = {
  render: () => row(makeRating({ value: 3, max: 5, precision: 'full' })),
};

// h2: Precision: half
export const PrecisionHalf: Story = {
  render: () => row(makeRating({ value: 3.5, max: 5, precision: 'half' })),
};

// h2: Readonly: false (interactive)
export const ReadonlyFalse: Story = {
  render: () => row(makeRating({ value: 2, max: 5 })),
};

// h2: Readonly: true
export const ReadonlyTrue: Story = {
  render: () => row(makeRating({ value: 4, max: 5, readonly: true })),
};

// h2: Max: 5 (default)
export const Max5: Story = {
  render: () => row(makeRating({ value: 3, max: 5 })),
};

// h2: Max: 3
export const Max3: Story = {
  render: () => row(makeRating({ value: 2, max: 3 })),
};

// h2: Max: 7
export const Max7: Story = {
  render: () => row(makeRating({ value: 5, max: 7 })),
};

// h2: Max: 10
export const Max10: Story = {
  render: () => row(makeRating({ value: 7, max: 10 })),
};

// h2: Custom icon: heart
export const CustomIconHeart: Story = {
  render: () => row(makeRating({ value: 3, max: 5, icon: '❤️' })),
};

// h2: Custom icon: thumbs up
export const CustomIconThumbsUp: Story = {
  render: () => row(makeRating({ value: 4, max: 5, icon: '👍' })),
};

// h2: Custom icon: fire
export const CustomIconFire: Story = {
  render: () => row(makeRating({ value: 2, max: 5, icon: '🔥' })),
};

// h2: Custom icon: circle
export const CustomIconCircle: Story = {
  render: () => row(makeRating({ value: 3, max: 5, icon: '●' })),
};

// h2: Size x Precision matrix
export const SizeXPrecisionMatrix: Story = {
  render: () => col(
    ...SIZES.map(s => row(
      ...PRECISIONS.map(p => makeRating({ value: 3.5, max: 5, size: s, precision: p })),
    )),
  ),
};

// h2: Readonly x Size
export const ReadonlyXSize: Story = {
  render: () => col(
    ...SIZES.map(s => makeRating({ value: 4, max: 5, size: s, readonly: true })),
  ),
};

// h2: Empty (value=0)
export const Empty: Story = {
  render: () => row(makeRating({ value: 0, max: 5 })),
};

// h2: Full (value=max)
export const Full: Story = {
  render: () => row(makeRating({ value: 5, max: 5 })),
};

// h2: CSS Parts Styling
// Parts: base, star
export const CSSPartsStyling: Story = {
  render: () => {
    const style = document.createElement('style');
    style.textContent = `
      /* snice-rating exposes the following CSS parts:
         ::part(base) — the root rating container
         ::part(star) — each individual star span */
      .parts-demo .styled-rating::part(base) {
        background: #0f172a;
        border-radius: 10px;
        padding: 8px 12px;
        border: 1px solid #f59e0b44;
        box-shadow: 0 2px 12px rgba(245,158,11,.15);
        display: inline-flex;
      }
      .parts-demo .styled-rating::part(star) {
        font-size: 2rem;
        filter: drop-shadow(0 0 4px #f59e0b);
        transition: transform .15s;
      }
    `;

    const wrap = document.createElement('div');
    wrap.className = 'parts-demo';
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';

    const lbl1 = document.createElement('p');
    lbl1.textContent = 'Default (no ::part() overrides)';
    lbl1.style.cssText = 'margin:0;font-size:.75rem;opacity:.6;';
    const defaultRating = makeRating({ value: 4, max: 5 });

    const lbl2 = document.createElement('p');
    lbl2.textContent = 'Styled via ::part(base/star) — dark card, glowing stars';
    lbl2.style.cssText = 'margin:0;font-size:.75rem;opacity:.6;';
    const styledRating = makeRating({ value: 4, max: 5 });
    styledRating.className = 'styled-rating';

    wrap.appendChild(style);
    wrap.appendChild(lbl1);
    wrap.appendChild(defaultRating);
    wrap.appendChild(lbl2);
    wrap.appendChild(styledRating);
    return wrap;
  },
};

import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-pagination';
import type { PaginationSize, PaginationVariant } from './snice-pagination.types';

type Args = {
  current?: number;
  total?: number;
  siblings?: number;
  size?: PaginationSize;
  variant?: PaginationVariant;
  showFirst?: boolean;
  showLast?: boolean;
  showPrev?: boolean;
  showNext?: boolean;
};

const SIZES: PaginationSize[] = ['small', 'medium', 'large'];
const VARIANTS: PaginationVariant[] = ['default', 'rounded', 'text'];

function makePagination(attrs: Record<string, string | boolean> = {}) {
  const el = document.createElement('snice-pagination');
  for (const [k, v] of Object.entries(attrs)) {
    if (typeof v === 'boolean') {
      if (!v) el.setAttribute(k, 'false');
    } else {
      el.setAttribute(k, v);
    }
  }
  return el;
}

function col(...els: HTMLElement[]) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;flex-direction:column;gap:.75rem;';
  els.forEach(el => wrap.appendChild(el));
  return wrap;
}

function row(...els: HTMLElement[]) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;align-items:center;gap:.75rem;flex-wrap:wrap;';
  els.forEach(el => wrap.appendChild(el));
  return wrap;
}

const meta: Meta<Args> = {
  title: 'Pagination',
  component: 'snice-pagination',
  tags: ['autodocs'],
  argTypes: {
    current:   { control: 'number' },
    total:     { control: 'number' },
    siblings:  { control: 'number' },
    size:      { control: 'select', options: SIZES },
    variant:   { control: 'select', options: VARIANTS },
    showFirst: { control: 'boolean' },
    showLast:  { control: 'boolean' },
    showPrev:  { control: 'boolean' },
    showNext:  { control: 'boolean' },
  },
  render: (args) => {
    const el = document.createElement('snice-pagination');
    if (args.current   !== undefined) el.setAttribute('current',    String(args.current));
    if (args.total     !== undefined) el.setAttribute('total',      String(args.total));
    if (args.siblings  !== undefined) el.setAttribute('siblings',   String(args.siblings));
    if (args.size      !== undefined) el.setAttribute('size',       args.size);
    if (args.variant   !== undefined) el.setAttribute('variant',    args.variant);
    if (args.showFirst === false)     el.setAttribute('show-first', 'false');
    if (args.showLast  === false)     el.setAttribute('show-last',  'false');
    if (args.showPrev  === false)     el.setAttribute('show-prev',  'false');
    if (args.showNext  === false)     el.setAttribute('show-next',  'false');
    return el;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {
  args: { current: 5, total: 10, variant: 'default', size: 'medium' },
};

// h2: Variant: default
export const VariantDefault: Story = {
  render: () => makePagination({ current: '5', total: '10', variant: 'default' }),
};

// h2: Variant: rounded
export const VariantRounded: Story = {
  render: () => makePagination({ current: '5', total: '10', variant: 'rounded' }),
};

// h2: Variant: text
export const VariantText: Story = {
  render: () => makePagination({ current: '5', total: '10', variant: 'text' }),
};

// h2: Size: small
export const SizeSmall: Story = {
  render: () => makePagination({ current: '3', total: '10', size: 'small' }),
};

// h2: Size: medium (default)
export const SizeMedium: Story = {
  render: () => makePagination({ current: '3', total: '10', size: 'medium' }),
};

// h2: Size: large
export const SizeLarge: Story = {
  render: () => makePagination({ current: '3', total: '10', size: 'large' }),
};

// h2: Size x Variant matrix
export const SizeXVariantMatrix: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:.5rem;';
    for (const size of SIZES) {
      for (const variant of VARIANTS) {
        const rowEl = row(makePagination({ current: '5', total: '20', size, variant }));
        const lbl = document.createElement('span');
        lbl.style.cssText = 'font-size:.7rem;color:#888;';
        lbl.textContent = `${size} / ${variant}`;
        rowEl.appendChild(lbl);
        wrap.appendChild(rowEl);
      }
    }
    return wrap;
  },
};

// h2: Siblings: 1 (default)
export const Siblings1: Story = {
  render: () => makePagination({ current: '10', total: '20', siblings: '1' }),
};

// h2: Siblings: 2
export const Siblings2: Story = {
  render: () => makePagination({ current: '10', total: '20', siblings: '2' }),
};

// h2: Siblings: 3
export const Siblings3: Story = {
  render: () => makePagination({ current: '10', total: '20', siblings: '3' }),
};

// h2: show-first="false"
export const ShowFirstFalse: Story = {
  render: () => makePagination({ current: '5', total: '10', 'show-first': false }),
};

// h2: show-last="false"
export const ShowLastFalse: Story = {
  render: () => makePagination({ current: '5', total: '10', 'show-last': false }),
};

// h2: show-prev="false"
export const ShowPrevFalse: Story = {
  render: () => makePagination({ current: '5', total: '10', 'show-prev': false }),
};

// h2: show-next="false"
export const ShowNextFalse: Story = {
  render: () => makePagination({ current: '5', total: '10', 'show-next': false }),
};

// h2: All nav buttons hidden
export const AllNavButtonsHidden: Story = {
  render: () => makePagination({
    current: '5', total: '10',
    'show-first': false, 'show-last': false, 'show-prev': false, 'show-next': false,
  }),
};

// h2: First page (prev/first disabled)
export const FirstPage: Story = {
  render: () => makePagination({ current: '1', total: '10' }),
};

// h2: Last page (next/last disabled)
export const LastPage: Story = {
  render: () => makePagination({ current: '10', total: '10' }),
};

// h2: Single page
export const SinglePage: Story = {
  render: () => makePagination({ current: '1', total: '1' }),
};

// h2: Few pages (no ellipsis)
export const FewPages: Story = {
  render: () => makePagination({ current: '2', total: '3' }),
};

// h2: Many pages (total=100)
export const ManyPages: Story = {
  render: () => makePagination({ current: '50', total: '100' }),
};

// h2: CSS Parts Styling
// Parts: base, button (all nav buttons share this), first-button, prev-button,
//        pages, ellipsis, next-button, last-button
export const CSSPartsStyling: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'parts-demo';

    const style = document.createElement('style');
    style.textContent = `
      .parts-demo { display: flex; flex-direction: column; gap: 1.5rem; font-family: sans-serif; }
      .parts-demo .label { font-size: .7rem; color: #888; margin-bottom: .25rem; }

      /* Styled: base */
      .parts-demo .styled-base::part(base) {
        background: #1e293b;
        padding: .5rem 1rem;
        border-radius: 10px;
      }

      /* Styled: all buttons via shared part */
      .parts-demo .styled-buttons::part(button) {
        background: #7c3aed;
        color: #fff;
        border-color: #7c3aed;
        border-radius: 50%;
        font-weight: 700;
      }

      /* Styled: first-button and last-button specifically */
      .parts-demo .styled-first-last::part(first-button),
      .parts-demo .styled-first-last::part(last-button) {
        background: #059669;
        color: #fff;
        border-color: #059669;
        font-weight: 900;
      }

      /* Styled: pages container */
      .parts-demo .styled-pages::part(pages) {
        background: rgba(251,191,36,0.15);
        border-radius: 6px;
        padding: 0 .5rem;
        gap: .25rem;
      }

      /* Styled: ellipsis */
      .parts-demo .styled-ellipsis::part(ellipsis) {
        color: #f97316;
        font-weight: 900;
        font-size: 1.1em;
        letter-spacing: .15em;
      }

      /* Combined */
      .parts-demo .styled-all::part(base) { background: #0f172a; padding: .5rem 1rem; border-radius: 12px; }
      .parts-demo .styled-all::part(button) { border-radius: 6px; background: #334155; color: #e2e8f0; border-color: #475569; }
      .parts-demo .styled-all::part(pages) { gap: .2rem; }
      .parts-demo .styled-all::part(ellipsis) { color: #94a3b8; }
    `;
    wrap.appendChild(style);

    function row(label: string, cls: string, el: HTMLElement) {
      const d = document.createElement('div');
      const l = document.createElement('div');
      l.className = 'label';
      l.textContent = label;
      el.classList.add(cls);
      d.appendChild(l);
      d.appendChild(el);
      return d;
    }

    wrap.appendChild(row('Default (no ::part styles)', '', makePagination({ current: '5', total: '10' })));
    wrap.appendChild(row('::part(base) — dark container background', 'styled-base', makePagination({ current: '5', total: '10' })));
    wrap.appendChild(row('::part(button) — purple circle all nav buttons', 'styled-buttons', makePagination({ current: '5', total: '10' })));
    wrap.appendChild(row('::part(first-button) + ::part(last-button) — green jump buttons', 'styled-first-last', makePagination({ current: '5', total: '10' })));
    wrap.appendChild(row('::part(pages) — yellow-tinted pages area', 'styled-pages', makePagination({ current: '5', total: '10' })));
    wrap.appendChild(row('::part(ellipsis) — orange bold ellipsis (many pages)', 'styled-ellipsis', makePagination({ current: '50', total: '100' })));
    wrap.appendChild(row('Combined: base + button + pages + ellipsis', 'styled-all', makePagination({ current: '50', total: '100' })));

    return wrap;
  },
};

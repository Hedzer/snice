import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-breadcrumbs';
import './snice-crumb';
import type { BreadcrumbSeparator, BreadcrumbSize, BreadcrumbItem } from './snice-breadcrumbs.types';

type Args = {
  separator?: BreadcrumbSeparator;
  size?: BreadcrumbSize;
  maxItems?: number;
};

const SEPARATORS: BreadcrumbSeparator[] = ['/', '>', '»', '•', '|'];
const SIZES: BreadcrumbSize[] = ['small', 'medium', 'large'];

const BASIC_ITEMS: BreadcrumbItem[] = [
  { label: 'Home', href: '#' },
  { label: 'Products', href: '#products' },
  { label: 'Electronics', href: '#electronics' },
  { label: 'Current Page' },
];

function makeBreadcrumbs(items: BreadcrumbItem[], attrs: Record<string, string> = {}) {
  const el = document.createElement('snice-breadcrumbs');
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  (el as any).items = items;
  return el;
}

function stack(...els: HTMLElement[]) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;flex-direction:column;gap:.75rem;';
  els.forEach(el => wrap.appendChild(el));
  return wrap;
}

const meta: Meta<Args> = {
  title: 'Breadcrumbs',
  component: 'snice-breadcrumbs',
  tags: ['autodocs'],
  argTypes: {
    separator: { control: 'select', options: SEPARATORS },
    size:      { control: 'select', options: SIZES },
    maxItems:  { control: 'number' },
  },
  render: (args) => {
    const el = document.createElement('snice-breadcrumbs');
    if (args.separator !== undefined) el.setAttribute('separator', args.separator);
    if (args.size      !== undefined) el.setAttribute('size', args.size);
    if (args.maxItems  !== undefined) el.setAttribute('max-items', String(args.maxItems));
    (el as any).items = BASIC_ITEMS;
    return el;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {
  args: { separator: '/', size: 'medium' },
};

// h2: All separators
export const AllSeparators: Story = {
  render: () => stack(
    ...SEPARATORS.map(sep => makeBreadcrumbs(BASIC_ITEMS, { separator: sep })),
  ),
};

// h2: All sizes
export const AllSizes: Story = {
  render: () => stack(
    ...SIZES.map(size => makeBreadcrumbs(BASIC_ITEMS, { size })),
  ),
};

// h2: With href links
export const WithHrefLinks: Story = {
  render: () => makeBreadcrumbs([
    { label: 'Home', href: '#home' },
    { label: 'Category', href: '#category' },
    { label: 'Subcategory', href: '#subcategory' },
    { label: 'Active Page' },
  ]),
};

// h2: With icons (emoji)
export const WithIconsEmoji: Story = {
  render: () => makeBreadcrumbs([
    { label: 'Home', href: '#', icon: 'home' },
    { label: 'Settings', href: '#', icon: 'settings' },
    { label: 'Profile', icon: 'user' },
  ]),
};

// h2: With icon images (URL)
export const WithIconImages: Story = {
  render: () => makeBreadcrumbs([
    { label: 'Home', href: '#', iconImage: 'https://i.pravatar.cc/16?img=1' },
    { label: 'Dashboard', href: '#', iconImage: 'https://i.pravatar.cc/16?img=2' },
    { label: 'Settings' },
  ]),
};

// h2: max-items (collapsed with ellipsis)
export const MaxItemsCollapsed: Story = {
  render: () => {
    const deep = [
      { label: 'Root', href: '#' },
      { label: 'Level 1', href: '#' },
      { label: 'Level 2', href: '#' },
      { label: 'Level 3', href: '#' },
      { label: 'Level 4', href: '#' },
      { label: 'Current' },
    ];
    return stack(
      makeBreadcrumbs(deep, { 'max-items': '3' }),
      makeBreadcrumbs(deep, { 'max-items': '2' }),
      makeBreadcrumbs(deep, { 'max-items': '0' }),
    );
  },
};

// h2: Declarative API (snice-crumb child elements)
export const DeclarativeApi: Story = {
  render: () => {
    const el = document.createElement('snice-breadcrumbs');
    const crumbs: { label: string; href?: string; active?: boolean }[] = [
      { label: 'Home', href: '#home' },
      { label: 'Products', href: '#products' },
      { label: 'Electronics', href: '#electronics' },
      { label: 'Phones', active: true },
    ];
    crumbs.forEach(c => {
      const crumb = document.createElement('snice-crumb');
      crumb.setAttribute('label', c.label);
      if (c.href) crumb.setAttribute('href', c.href);
      if (c.active) crumb.toggleAttribute('active', true);
      el.appendChild(crumb);
    });
    return el;
  },
};

// h2: Single item
export const SingleItem: Story = {
  render: () => makeBreadcrumbs([{ label: 'Only Item' }]),
};

// h2: Two items
export const TwoItems: Story = {
  render: () => makeBreadcrumbs([{ label: 'Home', href: '#' }, { label: 'Current' }]),
};

// h2: Many items (8)
export const ManyItems: Story = {
  render: () => makeBreadcrumbs([
    { label: 'Home', href: '#' },
    { label: 'A', href: '#' },
    { label: 'B', href: '#' },
    { label: 'C', href: '#' },
    { label: 'D', href: '#' },
    { label: 'E', href: '#' },
    { label: 'F', href: '#' },
    { label: 'Current' },
  ]),
};

// h2: Edge case: very long labels
export const EdgeCaseVeryLongLabels: Story = {
  render: () => makeBreadcrumbs([
    { label: 'Enterprise Resource Planning Dashboard', href: '#' },
    { label: 'Human Resources Management Module', href: '#' },
    { label: 'Employee Performance Review System' },
  ]),
};

// h2: Edge case: single character labels
export const EdgeCaseSingleCharacterLabels: Story = {
  render: () => makeBreadcrumbs([
    { label: 'A', href: '#' },
    { label: 'B', href: '#' },
    { label: 'C' },
  ]),
};

// h2: Size x Separator matrix
export const SizeXSeparatorMatrix: Story = {
  render: () => stack(
    makeBreadcrumbs(BASIC_ITEMS, { size: 'small',  separator: '/' }),
    makeBreadcrumbs(BASIC_ITEMS, { size: 'medium', separator: '>' }),
    makeBreadcrumbs(BASIC_ITEMS, { size: 'large',  separator: '»' }),
  ),
};

// h2: CSS Parts Styling
// Parts: base, list, link, separator, ellipsis
export const CSSPartsStyling: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'parts-demo';

    const style = document.createElement('style');
    style.textContent = `
      .parts-demo { display: flex; flex-direction: column; gap: 1.5rem; font-family: sans-serif; }
      .parts-demo .label { font-size: .7rem; color: #888; margin-bottom: .25rem; }

      /* Default (no ::part styling) */
      .parts-demo .default-bc {}

      /* Styled: base */
      .parts-demo .styled-base::part(base) {
        background: #1e293b;
        padding: .5rem 1rem;
        border-radius: 8px;
      }

      /* Styled: list */
      .parts-demo .styled-list::part(list) {
        gap: 1rem;
      }

      /* Styled: link */
      .parts-demo .styled-link::part(link) {
        color: #f97316;
        font-weight: 700;
        text-decoration: underline;
        text-underline-offset: 3px;
      }

      /* Styled: separator */
      .parts-demo .styled-sep::part(separator) {
        color: #a855f7;
        font-size: 1.2em;
        font-weight: 900;
      }

      /* Styled: ellipsis */
      .parts-demo .styled-ellipsis::part(ellipsis) {
        background: #0ea5e9;
        color: #fff;
        border-radius: 4px;
        padding: 0 .4rem;
        font-weight: 700;
      }

      /* Combined */
      .parts-demo .styled-all::part(base) { background: #0f172a; padding: .5rem 1rem; border-radius: 10px; }
      .parts-demo .styled-all::part(link) { color: #34d399; font-weight: 600; }
      .parts-demo .styled-all::part(separator) { color: #64748b; }
    `;
    wrap.appendChild(style);

    const items = BASIC_ITEMS;
    const deepItems = [
      { label: 'Root', href: '#' },
      { label: 'A', href: '#' },
      { label: 'B', href: '#' },
      { label: 'C', href: '#' },
      { label: 'D', href: '#' },
      { label: 'Current' },
    ];

    function row(label: string, cls: string, bc: HTMLElement) {
      const d = document.createElement('div');
      const l = document.createElement('div');
      l.className = 'label';
      l.textContent = label;
      bc.classList.add(cls);
      d.appendChild(l);
      d.appendChild(bc);
      return d;
    }

    wrap.appendChild(row('Default (no ::part styles)', 'default-bc', makeBreadcrumbs(items)));
    wrap.appendChild(row('::part(base) — dark background container', 'styled-base', makeBreadcrumbs(items)));
    wrap.appendChild(row('::part(list) — wider gap between crumbs', 'styled-list', makeBreadcrumbs(items)));
    wrap.appendChild(row('::part(link) — orange bold underlined links', 'styled-link', makeBreadcrumbs(items)));
    wrap.appendChild(row('::part(separator) — purple bold separator', 'styled-sep', makeBreadcrumbs(items)));
    wrap.appendChild(row('::part(ellipsis) — blue pill ellipsis (max-items=3)', 'styled-ellipsis', makeBreadcrumbs(deepItems, { 'max-items': '3' })));
    wrap.appendChild(row('Combined: base + link + separator', 'styled-all', makeBreadcrumbs(items)));

    return wrap;
  },
};

import type { Meta, StoryObj } from '@storybook/web-components-vite';
import './snice-masonry';

type Args = {
  columns?: number;
  gap?: string;
  minColumnWidth?: string;
};

function makeCard(label: string, minHeight: string) {
  const el = document.createElement('div');
  el.style.cssText = `background:var(--snice-color-background-element,#f9f9f9);border:1px solid var(--snice-color-border,#ddd);border-radius:8px;padding:1rem;font-size:.875rem;min-height:${minHeight};`;
  el.textContent = label;
  return el;
}

function makeMasonry(attrs: Record<string, string | boolean>, cards: HTMLElement[]) {
  const el = document.createElement('snice-masonry');
  for (const [k, v] of Object.entries(attrs)) {
    if (typeof v === 'boolean') { if (v) el.toggleAttribute(k, true); }
    else el.setAttribute(k, v);
  }
  cards.forEach(c => el.appendChild(c));
  return el;
}

type CardSpec = [string, string]; // [label, minHeight]

const BASE_CARDS: CardSpec[] = [
  ['Card 1 (tall)',  '120px'],
  ['Card 2 (short)', '40px'],
  ['Card 3 (medium)','80px'],
  ['Card 4 (extra tall)', '180px'],
  ['Card 5 (short)', '40px'],
  ['Card 6 (medium)','80px'],
  ['Card 7 (tall)',  '120px'],
  ['Card 8 (short)', '40px'],
  ['Card 9 (medium)','80px'],
];

const meta: Meta<Args> = {
  title: 'Layout/Masonry',
  component: 'snice-masonry',
  tags: ['autodocs'],
  argTypes: {
    columns:        { control: 'number' },
    gap:            { control: 'text' },
    minColumnWidth: { control: 'text' },
  },
  render: (args) => {
    const attrs: Record<string, string> = {
      columns: String(args.columns ?? 3),
    };
    if (args.gap            !== undefined) attrs['gap']              = args.gap;
    if (args.minColumnWidth !== undefined) attrs['min-column-width'] = args.minColumnWidth;
    return makeMasonry(attrs, BASE_CARDS.map(([l, h]) => makeCard(l, h)));
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = { args: { columns: 3, gap: '1rem' } };

// h2: Columns: 3 (default)
export const Columns3Default: Story = {
  render: () => makeMasonry({ columns: '3' }, BASE_CARDS.map(([l, h]) => makeCard(l, h))),
};

// h2: Columns: 1
export const Columns1: Story = {
  render: () => makeMasonry({ columns: '1' }, [
    makeCard('Card 1', '40px'),
    makeCard('Card 2', '80px'),
    makeCard('Card 3', '40px'),
  ]),
};

// h2: Columns: 2
export const Columns2: Story = {
  render: () => makeMasonry({ columns: '2' }, [
    makeCard('Card 1', '120px'),
    makeCard('Card 2', '40px'),
    makeCard('Card 3', '80px'),
    makeCard('Card 4', '120px'),
    makeCard('Card 5', '40px'),
    makeCard('Card 6', '80px'),
  ]),
};

// h2: Columns: 4
export const Columns4: Story = {
  render: () => {
    const specs: CardSpec[] = [
      ['1','40px'],['2','80px'],['3','120px'],['4','40px'],
      ['5','180px'],['6','40px'],['7','80px'],['8','120px'],
      ['9','40px'],['10','80px'],['11','40px'],['12','120px'],
    ];
    return makeMasonry({ columns: '4' }, specs.map(([l, h]) => makeCard(l, h)));
  },
};

// h2: Columns: 5
export const Columns5: Story = {
  render: () => {
    const specs: CardSpec[] = [
      ['1','40px'],['2','80px'],['3','120px'],['4','40px'],['5','80px'],
      ['6','120px'],['7','40px'],['8','80px'],['9','40px'],['10','120px'],
    ];
    return makeMasonry({ columns: '5' }, specs.map(([l, h]) => makeCard(l, h)));
  },
};

// h2: Columns: 0 (auto-responsive based on min-column-width)
export const Columns0AutoResponsive: Story = {
  render: () => makeMasonry({ columns: '0', 'min-column-width': '200px' }, [
    makeCard('Auto 1', '120px'),
    makeCard('Auto 2', '40px'),
    makeCard('Auto 3', '80px'),
    makeCard('Auto 4', '120px'),
    makeCard('Auto 5', '40px'),
    makeCard('Auto 6', '80px'),
  ]),
};

// h2: Min column width: 150px (auto columns)
export const MinColumnWidth150px: Story = {
  render: () => makeMasonry({ columns: '0', 'min-column-width': '150px' }, [
    makeCard('A', '40px'),
    makeCard('B', '80px'),
    makeCard('C', '120px'),
    makeCard('D', '40px'),
    makeCard('E', '80px'),
    makeCard('F', '40px'),
  ]),
};

// h2: Min column width: 400px (auto columns)
export const MinColumnWidth400px: Story = {
  render: () => makeMasonry({ columns: '0', 'min-column-width': '400px' }, [
    makeCard('Wide A', '40px'),
    makeCard('Wide B', '80px'),
    makeCard('Wide C', '120px'),
  ]),
};

// h2: Gap: 0.25rem
export const Gap025rem: Story = {
  render: () => makeMasonry({ columns: '3', gap: '0.25rem' }, [
    makeCard('Tight 1', '40px'),
    makeCard('Tight 2', '80px'),
    makeCard('Tight 3', '120px'),
    makeCard('Tight 4', '40px'),
    makeCard('Tight 5', '80px'),
    makeCard('Tight 6', '40px'),
  ]),
};

// h2: Gap: 1rem (default)
export const Gap1remDefault: Story = {
  render: () => makeMasonry({ columns: '3', gap: '1rem' }, [
    makeCard('Default 1', '40px'),
    makeCard('Default 2', '80px'),
    makeCard('Default 3', '120px'),
    makeCard('Default 4', '40px'),
    makeCard('Default 5', '80px'),
    makeCard('Default 6', '40px'),
  ]),
};

// h2: Gap: 2rem
export const Gap2rem: Story = {
  render: () => makeMasonry({ columns: '3', gap: '2rem' }, [
    makeCard('Wide 1', '40px'),
    makeCard('Wide 2', '80px'),
    makeCard('Wide 3', '120px'),
    makeCard('Wide 4', '40px'),
    makeCard('Wide 5', '80px'),
    makeCard('Wide 6', '40px'),
  ]),
};

// h2: Single item
export const SingleItem: Story = {
  render: () => makeMasonry({ columns: '3' }, [makeCard('Only card', '80px')]),
};

// h2: Empty (no children)
export const EmptyNoChildren: Story = {
  render: () => makeMasonry({ columns: '3' }, []),
};

// h2: Mixed content heights
export const MixedContentHeights: Story = {
  render: () => {
    const heights = ['200px', '30px', '100px', '150px', '50px', '80px', '250px', '60px'];
    const labels  = ['Very tall', 'Tiny', 'Medium height', 'Tall-ish', 'Short', 'Normal', 'Tallest', 'Average'];
    return makeMasonry({ columns: '3', gap: '0.75rem' }, heights.map((h, i) => makeCard(labels[i], h)));
  },
};

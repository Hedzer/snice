import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-stat-group';
import type { StatGroupVariant, StatItem } from './snice-stat-group.types';

type Args = {
  variant?: StatGroupVariant;
  columns?: number;
};

const VARIANTS: StatGroupVariant[] = ['card', 'minimal', 'bordered'];

const BASE_STATS: StatItem[] = [
  { label: 'Revenue',    value: '$12,500' },
  { label: 'Users',      value: '1,234' },
  { label: 'Orders',     value: '567' },
  { label: 'Conversion', value: '4.2%' },
];

function makeGroup(stats: StatItem[], attrs: Record<string, string> = {}): HTMLElement {
  const el = document.createElement('snice-stat-group');
  for (const [k, v] of Object.entries(attrs)) {
    el.setAttribute(k, v);
  }
  (el as any).stats = stats;
  return el;
}

const meta: Meta<Args> = {
  title: 'Data/StatGroup',
  component: 'snice-stat-group',
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: VARIANTS },
    columns: { control: 'number' },
  },
  render: (args) => {
    const el = document.createElement('snice-stat-group');
    if (args.variant !== undefined) el.setAttribute('variant', args.variant);
    if (args.columns !== undefined) el.setAttribute('columns', String(args.columns));
    (el as any).stats = BASE_STATS;
    return el;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = { args: { variant: 'card' } };

// h2: Variant: Card (default)
export const VariantCard: Story = {
  render: () => makeGroup(BASE_STATS, { variant: 'card' }),
};

// h2: Variant: Minimal
export const VariantMinimal: Story = {
  render: () => makeGroup(BASE_STATS, { variant: 'minimal' }),
};

// h2: Variant: Bordered
export const VariantBordered: Story = {
  render: () => makeGroup(BASE_STATS, { variant: 'bordered' }),
};

// h2: With Trends (up, down, neutral)
export const WithTrends: Story = {
  render: () => makeGroup([
    { label: 'Revenue',  value: '$12,500', trend: 'up' },
    { label: 'Expenses', value: '$8,200',  trend: 'down' },
    { label: 'Users',    value: '1,234',   trend: 'neutral' },
    { label: 'Growth',   value: '15%',     trend: 'up' },
  ], { variant: 'card' }),
};

// h2: With Trend Values
export const WithTrendValues: Story = {
  render: () => makeGroup([
    { label: 'Revenue',  value: '$12,500', trend: 'up',      trendValue: '+12.5%' },
    { label: 'Expenses', value: '$8,200',  trend: 'down',    trendValue: '-3.2%' },
    { label: 'Users',    value: '1,234',   trend: 'neutral', trendValue: '0%' },
    { label: 'Profit',   value: '$4,300',  trend: 'up',      trendValue: '+28.1%' },
  ], { variant: 'card' }),
};

// h2: With Icons
export const WithIcons: Story = {
  render: () => makeGroup([
    { label: 'Revenue', value: '$12,500', icon: '💰' },
    { label: 'Users',   value: '1,234',   icon: '👥' },
    { label: 'Orders',  value: '567',     icon: '📦' },
    { label: 'Rating',  value: '4.8',     icon: '⭐' },
  ], { variant: 'card' }),
};

// h2: With Custom Colors
export const WithCustomColors: Story = {
  render: () => makeGroup([
    { label: 'Active',  value: '1,234', color: '#22c55e' },
    { label: 'Pending', value: '56',    color: '#f59e0b' },
    { label: 'Errors',  value: '3',     color: '#ef4444' },
    { label: 'Total',   value: '1,293', color: '#3b82f6' },
  ], { variant: 'card' }),
};

// h2: Custom Columns (2)
export const CustomColumns2: Story = {
  render: () => makeGroup(BASE_STATS, { variant: 'card', columns: '2' }),
};

// h2: Custom Columns (3)
export const CustomColumns3: Story = {
  render: () => makeGroup(BASE_STATS, { variant: 'card', columns: '3' }),
};

// h2: Custom Columns (4)
export const CustomColumns4: Story = {
  render: () => makeGroup(BASE_STATS, { variant: 'card', columns: '4' }),
};

// h2: Single Stat
export const SingleStat: Story = {
  render: () => makeGroup([
    { label: 'Total Revenue', value: '$125,000', trend: 'up', trendValue: '+15%' },
  ], { variant: 'card' }),
};

// h2: Many Stats
export const ManyStats: Story = {
  render: () => makeGroup([
    { label: 'Revenue',     value: '$12.5K' },
    { label: 'Profit',      value: '$4.3K' },
    { label: 'Users',       value: '1,234' },
    { label: 'Orders',      value: '567' },
    { label: 'Conversion',  value: '4.2%' },
    { label: 'Bounce Rate', value: '32%' },
  ], { variant: 'card', columns: '3' }),
};

// h2: All Trend Directions x Variants
export const AllTrendDirectionsXVariants: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    const trendStats: StatItem[] = [
      { label: 'Up Trend',   value: '100', trend: 'up',      trendValue: '+10%' },
      { label: 'Down Trend', value: '80',  trend: 'down',    trendValue: '-5%' },
      { label: 'Neutral',    value: '90',  trend: 'neutral', trendValue: '0%' },
    ];
    for (const variant of VARIANTS) {
      wrap.appendChild(makeGroup(trendStats, { variant }));
    }
    return wrap;
  },
};

// h2: Icons + Trends + Colors Combined
export const IconsTrendsColorsCombined: Story = {
  render: () => makeGroup([
    { label: 'Revenue',  value: '$12,500', trend: 'up',      trendValue: '+12%', icon: '💰', color: '#22c55e' },
    { label: 'Expenses', value: '$8,200',  trend: 'down',    trendValue: '-3%',  icon: '💸', color: '#ef4444' },
    { label: 'Users',    value: '1,234',   trend: 'up',      trendValue: '+8%',  icon: '👥', color: '#3b82f6' },
    { label: 'Rating',   value: '4.8',     trend: 'neutral', trendValue: '0%',   icon: '⭐', color: '#f59e0b' },
  ], { variant: 'card' }),
};

// h2: CSS Parts Styling
// Parts: base, stat
export const CSSPartsStyling: Story = {
  render: () => {
    const style = document.createElement('style');
    style.textContent = `
      .parts-demo { display: flex; flex-direction: column; gap: 1.5rem; padding: 1rem; }
      .parts-demo .item { display: flex; flex-direction: column; gap: .4rem; }
      .parts-demo .label { font-size: .65rem; color: #888; font-weight: 600; text-transform: uppercase; }

      /* ::part(base) — the stat group container */
      .parts-demo snice-stat-group.styled-base::part(base) {
        background: linear-gradient(90deg, #0f172a 0%, #1e1b4b 100%);
        border: 1px solid #4c1d95;
        border-radius: 16px;
        padding: 1rem;
        box-shadow: 0 4px 24px rgba(79,70,229,.2);
      }

      /* ::part(stat) — each individual stat cell */
      .parts-demo snice-stat-group.styled-stat::part(stat) {
        background: #fff;
        border: 2px solid #6366f1;
        border-radius: 12px;
        padding: 1rem 1.25rem;
        box-shadow: 4px 4px 0 #6366f1;
        transition: transform .15s, box-shadow .15s;
        cursor: default;
      }
      .parts-demo snice-stat-group.styled-stat::part(stat):hover {
        transform: translate(-2px, -2px);
        box-shadow: 6px 6px 0 #6366f1;
      }

      /* Combined: both base + stat */
      .parts-demo snice-stat-group.styled-both::part(base) {
        background: #fef3c7;
        border: 2px solid #f59e0b;
        border-radius: 16px;
        padding: .75rem;
        gap: .5rem;
      }
      .parts-demo snice-stat-group.styled-both::part(stat) {
        background: #fffbeb;
        border: 1px solid #fde68a;
        border-radius: 10px;
        padding: .75rem 1rem;
      }
    `;

    const wrap = document.createElement('div');
    wrap.appendChild(style);

    const demo = document.createElement('div');
    demo.className = 'parts-demo';

    const makeItem = (label: string, el: HTMLElement) => {
      const item = document.createElement('div');
      item.className = 'item';
      const lbl = document.createElement('div');
      lbl.className = 'label';
      lbl.textContent = label;
      item.appendChild(lbl);
      item.appendChild(el);
      return item;
    };

    const def = makeGroup(BASE_STATS, { variant: 'card' });
    demo.appendChild(makeItem('default (no ::part overrides)', def));

    const styledBase = makeGroup(BASE_STATS, { variant: 'card' });
    styledBase.className = 'styled-base';
    demo.appendChild(makeItem('::part(base) — dark indigo container', styledBase));

    const styledStat = makeGroup(BASE_STATS, { variant: 'card' });
    styledStat.className = 'styled-stat';
    demo.appendChild(makeItem('::part(stat) — outlined cards with hover lift', styledStat));

    const styledBoth = makeGroup(BASE_STATS, { variant: 'card' });
    styledBoth.className = 'styled-both';
    demo.appendChild(makeItem('::part(base) + ::part(stat) — amber theme', styledBoth));

    wrap.appendChild(demo);
    return wrap;
  },
};

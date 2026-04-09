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

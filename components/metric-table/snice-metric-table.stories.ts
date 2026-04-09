import type { Meta, StoryObj } from '@storybook/web-components-vite';
import './snice-metric-table';

type Args = {
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
};

function makeTable(
  columns: object[],
  data: object[],
  attrs: Record<string, string> = {},
): HTMLElement {
  const el = document.createElement('snice-metric-table');
  el.style.cssText = 'display:block;max-width:800px;';
  for (const [k, v] of Object.entries(attrs)) {
    el.setAttribute(k, v);
  }
  (el as any).columns = columns;
  (el as any).data = data;
  return el;
}

const meta: Meta<Args> = {
  title: 'Data/MetricTable',
  component: 'snice-metric-table',
  tags: ['autodocs'],
  argTypes: {
    sortBy:        { control: 'text' },
    sortDirection: { control: 'select', options: ['asc', 'desc'] },
  },
  render: (args) => {
    const el = document.createElement('snice-metric-table');
    el.style.cssText = 'display:block;max-width:800px;';
    if (args.sortBy        !== undefined) el.setAttribute('sort-by',        args.sortBy);
    if (args.sortDirection !== undefined) el.setAttribute('sort-direction', args.sortDirection);
    (el as any).columns = [
      { key: 'name',  label: 'Metric', type: 'text' },
      { key: 'value', label: 'Value',  type: 'number' },
    ];
    (el as any).data = [
      { name: 'Page Views', value: 124500 },
      { name: 'Sessions',   value: 256789 },
      { name: 'Events',     value: 1023456 },
    ];
    return el;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {};

// h2: Column type: text
export const ColumnTypeText: Story = {
  render: () => makeTable(
    [{ key: 'name', label: 'Metric', type: 'text' }, { key: 'category', label: 'Category', type: 'text' }],
    [{ name: 'Page Views', category: 'Traffic' }, { name: 'Bounce Rate', category: 'Engagement' }, { name: 'Conversion', category: 'Revenue' }],
  ),
};

// h2: Column type: number
export const ColumnTypeNumber: Story = {
  render: () => makeTable(
    [{ key: 'name', label: 'Metric', type: 'text' }, { key: 'value', label: 'Value', type: 'number' }],
    [{ name: 'Users', value: 124500 }, { name: 'Sessions', value: 256789 }, { name: 'Events', value: 1023456 }],
  ),
};

// h2: Column type: percent
export const ColumnTypePercent: Story = {
  render: () => makeTable(
    [{ key: 'name', label: 'Metric', type: 'text' }, { key: 'pct', label: 'Percentage', type: 'percent' }],
    [{ name: 'Conversion Rate', pct: 3.2 }, { name: 'Bounce Rate', pct: -12.5 }, { name: 'Growth', pct: 24.8 }, { name: 'Churn', pct: -1.3 }],
  ),
};

// h2: Column type: currency (USD)
export const ColumnTypeCurrencyUsd: Story = {
  render: () => makeTable(
    [{ key: 'name', label: 'Product', type: 'text' }, { key: 'revenue', label: 'Revenue (USD)', type: 'currency', format: 'USD' }],
    [{ name: 'Widget A', revenue: 45210.50 }, { name: 'Widget B', revenue: 12340.00 }, { name: 'Widget C', revenue: 89100.75 }],
  ),
};

// h2: Column type: currency (EUR)
export const ColumnTypeCurrencyEur: Story = {
  render: () => makeTable(
    [{ key: 'name', label: 'Product', type: 'text' }, { key: 'revenue', label: 'Revenue (EUR)', type: 'currency', format: 'EUR' }],
    [{ name: 'Service X', revenue: 15000 }, { name: 'Service Y', revenue: 28500 }],
  ),
};

// h2: Sparkline column
export const SparklineColumn: Story = {
  render: () => makeTable(
    [{ key: 'name', label: 'Metric', type: 'text' }, { key: 'trend', label: 'Trend', sparkline: true }],
    [
      { name: 'Traffic', trend: [100, 120, 130, 150, 180, 200] },
      { name: 'Revenue', trend: [200, 180, 160, 140, 120, 100] },
      { name: 'Users',   trend: [50, 55, 60, 58, 65, 70] },
    ],
  ),
};

// h2: All column types combined
export const AllColumnTypesCombined: Story = {
  render: () => makeTable(
    [
      { key: 'name',    label: 'Metric',  type: 'text' },
      { key: 'value',   label: 'Value',   type: 'number' },
      { key: 'change',  label: 'Change',  type: 'percent' },
      { key: 'revenue', label: 'Revenue', type: 'currency', format: 'USD' },
      { key: 'trend',   label: 'Trend',   sparkline: true },
    ],
    [
      { name: 'Page Views', value: 124500, change: 12.3,  revenue: 4521.50, trend: [100, 120, 130, 150, 180] },
      { name: 'Bounce Rate', value: 34,   change: -2.5,  revenue: null,    trend: [40, 38, 35, 33, 30] },
      { name: 'Conversion',  value: 892,  change: 5.1,   revenue: 12340,   trend: [60, 65, 70, 72, 80] },
      { name: 'Revenue',    value: 58200, change: -0.8,  revenue: 58200,   trend: [500, 480, 510, 490, 520] },
    ],
  ),
};

// h2: Sort by: value (desc default)
export const SortByValueDescDefault: Story = {
  render: () => makeTable(
    [{ key: 'name', label: 'Name', type: 'text' }, { key: 'value', label: 'Value', type: 'number' }],
    [{ name: 'C', value: 300 }, { name: 'A', value: 100 }, { name: 'B', value: 200 }],
    { 'sort-by': 'value' },
  ),
};

// h2: Sort direction: asc
export const SortDirectionAsc: Story = {
  render: () => makeTable(
    [{ key: 'name', label: 'Name', type: 'text' }, { key: 'value', label: 'Value', type: 'number' }],
    [{ name: 'C', value: 300 }, { name: 'A', value: 100 }, { name: 'B', value: 200 }],
    { 'sort-by': 'value', 'sort-direction': 'asc' },
  ),
};

// h2: Sort direction: desc
export const SortDirectionDesc: Story = {
  render: () => makeTable(
    [{ key: 'name', label: 'Name', type: 'text' }, { key: 'value', label: 'Value', type: 'number' }],
    [{ name: 'C', value: 300 }, { name: 'A', value: 100 }, { name: 'B', value: 200 }],
    { 'sort-by': 'value', 'sort-direction': 'desc' },
  ),
};

// h2: Positive and negative values (color coding)
export const PositiveAndNegativeValuesColorCoding: Story = {
  render: () => makeTable(
    [
      { key: 'name',   label: 'Metric', type: 'text' },
      { key: 'change', label: 'Change', type: 'percent' },
      { key: 'delta',  label: 'Delta',  type: 'number' },
    ],
    [
      { name: 'Growth',  change: 15.5,  delta: 250 },
      { name: 'Decline', change: -8.3,  delta: -120 },
      { name: 'Flat',    change: 0,     delta: 0 },
      { name: 'Surge',   change: 42.1,  delta: 1500 },
      { name: 'Drop',    change: -25.0, delta: -800 },
    ],
  ),
};

// h2: Null/undefined values (em-dash)
export const NullUndefinedValuesEmDash: Story = {
  render: () => makeTable(
    [
      { key: 'name',  label: 'Metric',  type: 'text' },
      { key: 'value', label: 'Value',   type: 'number' },
      { key: 'pct',   label: 'Percent', type: 'percent' },
      { key: 'rev',   label: 'Revenue', type: 'currency' },
    ],
    [
      { name: 'Complete', value: 100,       pct: 5.5,      rev: 1234 },
      { name: 'Partial',  value: null,      pct: 3.2,      rev: undefined },
      { name: 'Empty',    value: undefined, pct: null,     rev: null },
    ],
  ),
};

// h2: Single row
export const SingleRow: Story = {
  render: () => makeTable(
    [{ key: 'name', label: 'Name', type: 'text' }, { key: 'value', label: 'Value', type: 'number' }],
    [{ name: 'Only Row', value: 42 }],
  ),
};

// h2: Many rows
export const ManyRows: Story = {
  render: () => {
    const data = Array.from({ length: 15 }, (_, i) => ({
      name: `Metric ${i + 1}`,
      value: Math.round((i + 1) * 667),
      change: +(((i % 5) - 2) * 4.5).toFixed(1),
    }));
    return makeTable(
      [
        { key: 'name',   label: 'Metric', type: 'text' },
        { key: 'value',  label: 'Value',  type: 'number' },
        { key: 'change', label: 'Change', type: 'percent' },
      ],
      data,
    );
  },
};

// h2: Empty data
export const EmptyData: Story = {
  render: () => makeTable(
    [{ key: 'name', label: 'Name', type: 'text' }, { key: 'value', label: 'Value', type: 'number' }],
    [],
  ),
};

// h2: Sparkline: positive trend
export const SparklinePositiveTrend: Story = {
  render: () => makeTable(
    [{ key: 'name', label: 'Metric', type: 'text' }, { key: 'trend', label: 'Trend (up)', sparkline: true }],
    [{ name: 'Growth', trend: [10, 20, 30, 50, 80, 120] }],
  ),
};

// h2: Sparkline: negative trend
export const SparklineNegativeTrend: Story = {
  render: () => makeTable(
    [{ key: 'name', label: 'Metric', type: 'text' }, { key: 'trend', label: 'Trend (down)', sparkline: true }],
    [{ name: 'Decline', trend: [120, 100, 80, 60, 40, 20] }],
  ),
};

// h2: Multiple sparkline columns
export const MultipleSparklineColumns: Story = {
  render: () => makeTable(
    [
      { key: 'name',    label: 'Metric',  type: 'text' },
      { key: 'weekly',  label: 'Weekly',  sparkline: true },
      { key: 'monthly', label: 'Monthly', sparkline: true },
    ],
    [
      { name: 'Users',   weekly: [50, 55, 60, 58, 65],       monthly: [200, 220, 250, 280, 300] },
      { name: 'Revenue', weekly: [100, 95, 110, 105, 120],   monthly: [400, 380, 420, 450, 500] },
    ],
  ),
};

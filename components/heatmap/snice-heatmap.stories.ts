import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-heatmap';

type Args = {
  colorScheme?: string;
  weeks?: number;
  cellSize?: number;
  cellGap?: number;
  showLabels?: boolean;
  showTooltip?: boolean;
};

const COLOR_SCHEMES = ['green', 'blue', 'purple', 'orange', 'red'];

function generateData(weeks: number) {
  const data: { date: string; value: number }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < weeks * 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    if (Math.random() > 0.3) {
      data.push({ date: dateStr, value: Math.floor(Math.random() * 15) + 1 });
    }
  }
  return data;
}

const data52 = generateData(52);
const data26 = generateData(26);
const data12 = generateData(12);

function makeHeatmap(attrs: Record<string, string | number>, data?: { date: string; value: number }[]) {
  const el = document.createElement('snice-heatmap');
  for (const [k, v] of Object.entries(attrs)) {
    el.setAttribute(k, String(v));
  }
  if (data !== undefined) (el as any).data = data;
  return el;
}

const meta: Meta<Args> = {
  title: 'Charts/Heatmap',
  component: 'snice-heatmap',
  tags: ['autodocs'],
  argTypes: {
    colorScheme: { control: 'select', options: COLOR_SCHEMES },
    weeks: { control: 'number' },
    cellSize: { control: 'number' },
    cellGap: { control: 'number' },
    showLabels: { control: 'boolean' },
    showTooltip: { control: 'boolean' },
  },
  render: (args) => {
    const el = document.createElement('snice-heatmap');
    if (args.colorScheme !== undefined) el.setAttribute('color-scheme', String(args.colorScheme));
    if (args.weeks !== undefined) el.setAttribute('weeks', String(args.weeks));
    if (args.cellSize !== undefined) el.setAttribute('cell-size', String(args.cellSize));
    if (args.cellGap !== undefined) el.setAttribute('cell-gap', String(args.cellGap));
    if (args.showLabels !== undefined) el.setAttribute('show-labels', String(args.showLabels));
    if (args.showTooltip !== undefined) el.setAttribute('show-tooltip', String(args.showTooltip));
    (el as any).data = data26;
    return el;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = { args: { colorScheme: 'green', weeks: 26, showLabels: true } };

// h2: Color Scheme: green (default)
export const ColorSchemeGreen: Story = {
  render: () => makeHeatmap({ 'color-scheme': 'green' }, data52),
};

// h2: Color Scheme: blue
export const ColorSchemeBlue: Story = {
  render: () => makeHeatmap({ 'color-scheme': 'blue' }, data52),
};

// h2: Color Scheme: purple
export const ColorSchemePurple: Story = {
  render: () => makeHeatmap({ 'color-scheme': 'purple' }, data52),
};

// h2: Color Scheme: orange
export const ColorSchemeOrange: Story = {
  render: () => makeHeatmap({ 'color-scheme': 'orange' }, data52),
};

// h2: Color Scheme: red
export const ColorSchemeRed: Story = {
  render: () => makeHeatmap({ 'color-scheme': 'red' }, data52),
};

// h2: show-labels: true (default)
export const ShowLabelsTrue: Story = {
  render: () => makeHeatmap({ 'show-labels': 'true', weeks: 26 }, data26),
};

// h2: show-labels: false
export const ShowLabelsFalse: Story = {
  render: () => makeHeatmap({ 'show-labels': 'false', weeks: 26 }, data26),
};

// h2: Cell Size: 8px
export const CellSize8px: Story = {
  render: () => makeHeatmap({ 'cell-size': 8, weeks: 26 }, data26),
};

// h2: Cell Size: 12px (default)
export const CellSize12px: Story = {
  render: () => makeHeatmap({ 'cell-size': 12, weeks: 26 }, data26),
};

// h2: Cell Size: 18px
export const CellSize18px: Story = {
  render: () => makeHeatmap({ 'cell-size': 18, weeks: 26 }, data26),
};

// h2: Cell Gap: 1px
export const CellGap1px: Story = {
  render: () => makeHeatmap({ 'cell-gap': 1, weeks: 26 }, data26),
};

// h2: Cell Gap: 3px (default)
export const CellGap3px: Story = {
  render: () => makeHeatmap({ 'cell-gap': 3, weeks: 26 }, data26),
};

// h2: Cell Gap: 6px
export const CellGap6px: Story = {
  render: () => makeHeatmap({ 'cell-gap': 6, weeks: 26 }, data26),
};

// h2: show-tooltip: true (default)
export const ShowTooltipTrue: Story = {
  render: () => makeHeatmap({ 'show-tooltip': 'true', weeks: 26 }, data26),
};

// h2: show-tooltip: false
export const ShowTooltipFalse: Story = {
  render: () => makeHeatmap({ 'show-tooltip': 'false', weeks: 26 }, data26),
};

// h2: Weeks: 12
export const Weeks12: Story = {
  render: () => makeHeatmap({ weeks: 12 }, data12),
};

// h2: Weeks: 26
export const Weeks26: Story = {
  render: () => makeHeatmap({ weeks: 26 }, data26),
};

// h2: Weeks: 52 (default)
export const Weeks52: Story = {
  render: () => makeHeatmap({ weeks: 52 }, data52),
};

// h2: Purple + Large Cells + Wide Gap
export const PurpleLargeCellsWideGap: Story = {
  render: () => makeHeatmap({ 'color-scheme': 'purple', 'cell-size': 16, 'cell-gap': 4, weeks: 26 }, data26),
};

// h2: Red + Small Cells + No Labels
export const RedSmallCellsNoLabels: Story = {
  render: () => makeHeatmap({ 'color-scheme': 'red', 'cell-size': 8, 'show-labels': 'false' }, data52),
};

// h2: Edge: Empty Data
export const EdgeEmptyData: Story = {
  render: () => makeHeatmap({}, []),
};

// h2: Edge: Sparse Data
export const EdgeSparseData: Story = {
  render: () => makeHeatmap({}, generateData(52).filter(() => Math.random() > 0.8)),
};

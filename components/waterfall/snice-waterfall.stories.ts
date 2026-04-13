import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-waterfall';

type Args = {
  showValues?: boolean;
  showConnectors?: boolean;
};

const profitLoss = [
  { label: 'Revenue', value: 1000, type: 'total' },
  { label: 'COGS', value: -350 },
  { label: 'Gross Profit', value: 650, type: 'total' },
  { label: 'Salaries', value: -200 },
  { label: 'Marketing', value: -80 },
  { label: 'Rent', value: -50 },
  { label: 'Other', value: -20 },
  { label: 'Net Profit', value: 300, type: 'total' },
];

function makeWaterfall(attrs: Record<string, boolean | string>, data: object[], style?: string) {
  const el = document.createElement('snice-waterfall');
  for (const [k, v] of Object.entries(attrs)) {
    if (typeof v === 'boolean') {
      if (v) el.toggleAttribute(k, true);
    } else {
      el.setAttribute(k, String(v));
    }
  }
  el.style.cssText = style ?? 'display:block;width:100%;height:300px;';
  (el as any).data = data;
  return el;
}

const meta: Meta<Args> = {
  title: 'Charts/Waterfall',
  component: 'snice-waterfall',
  tags: ['autodocs'],
  argTypes: {
    showValues: { control: 'boolean' },
    showConnectors: { control: 'boolean' },
  },
  render: (args) => {
    const el = document.createElement('snice-waterfall');
    if (args.showValues) el.toggleAttribute('show-values', true);
    if (args.showConnectors) el.toggleAttribute('show-connectors', true);
    el.style.cssText = 'display:block;width:100%;height:300px;';
    (el as any).data = profitLoss;
    return el;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = { args: { showValues: true, showConnectors: true } };

// h2: Default (vertical, show-values, show-connectors)
export const DefaultVerticalShowValuesShowConnectors: Story = {
  render: () => makeWaterfall({ 'show-values': true, 'show-connectors': true }, profitLoss),
};

// h2: Show Values: true vs false
export const ShowValuesTrueVsFalse: Story = {
  render: () => {
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;';
    const wrap1 = document.createElement('div');
    const lbl1 = document.createElement('div');
    lbl1.style.cssText = 'font-size:0.7rem;color:var(--snice-color-text-tertiary);margin-bottom:0.25rem;';
    lbl1.textContent = 'show-values=true';
    wrap1.appendChild(lbl1);
    wrap1.appendChild(makeWaterfall({ 'show-values': true, 'show-connectors': true }, profitLoss, 'display:block;width:100%;height:280px;'));
    const wrap2 = document.createElement('div');
    const lbl2 = document.createElement('div');
    lbl2.style.cssText = 'font-size:0.7rem;color:var(--snice-color-text-tertiary);margin-bottom:0.25rem;';
    lbl2.textContent = 'show-values=false';
    wrap2.appendChild(lbl2);
    wrap2.appendChild(makeWaterfall({ 'show-connectors': true }, profitLoss, 'display:block;width:100%;height:280px;'));
    grid.appendChild(wrap1);
    grid.appendChild(wrap2);
    return grid;
  },
};

// h2: Show Connectors: true vs false
export const ShowConnectorsTrueVsFalse: Story = {
  render: () => {
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;';
    const wrap1 = document.createElement('div');
    const lbl1 = document.createElement('div');
    lbl1.style.cssText = 'font-size:0.7rem;color:var(--snice-color-text-tertiary);margin-bottom:0.25rem;';
    lbl1.textContent = 'show-connectors=true';
    wrap1.appendChild(lbl1);
    wrap1.appendChild(makeWaterfall({ 'show-values': true, 'show-connectors': true }, profitLoss, 'display:block;width:100%;height:280px;'));
    const wrap2 = document.createElement('div');
    const lbl2 = document.createElement('div');
    lbl2.style.cssText = 'font-size:0.7rem;color:var(--snice-color-text-tertiary);margin-bottom:0.25rem;';
    lbl2.textContent = 'show-connectors=false';
    wrap2.appendChild(lbl2);
    wrap2.appendChild(makeWaterfall({ 'show-values': true }, profitLoss, 'display:block;width:100%;height:280px;'));
    grid.appendChild(wrap1);
    grid.appendChild(wrap2);
    return grid;
  },
};

// h2: No Values, No Connectors
export const NoValuesNoConnectors: Story = {
  render: () => makeWaterfall({}, profitLoss),
};

// h2: Bar Types: increase, decrease, total
export const BarTypesIncreaseDecreaseTotal: Story = {
  render: () => makeWaterfall({ 'show-values': true, 'show-connectors': true }, [
    { label: 'Start', value: 500, type: 'total' },
    { label: 'Add', value: 200, type: 'increase' },
    { label: 'Remove', value: -100, type: 'decrease' },
    { label: 'End', value: 600, type: 'total' },
  ]),
};

// h2: All Increases
export const AllIncreases: Story = {
  render: () => makeWaterfall({ 'show-values': true, 'show-connectors': true }, [
    { label: 'Base', value: 100, type: 'total' },
    { label: 'Q1', value: 50 },
    { label: 'Q2', value: 75 },
    { label: 'Q3', value: 40 },
    { label: 'Q4', value: 60 },
    { label: 'Total', value: 325, type: 'total' },
  ]),
};

// h2: All Decreases
export const AllDecreases: Story = {
  render: () => makeWaterfall({ 'show-values': true, 'show-connectors': true }, [
    { label: 'Start', value: 1000, type: 'total' },
    { label: 'Cost A', value: -200 },
    { label: 'Cost B', value: -150 },
    { label: 'Cost C', value: -300 },
    { label: 'Remaining', value: 350, type: 'total' },
  ]),
};

// h2: Auto-detected Type (from value sign)
export const AutoDetectedType: Story = {
  render: () => makeWaterfall({ 'show-values': true, 'show-connectors': true }, [
    { label: 'Opening', value: 500, type: 'total' },
    { label: 'Sales', value: 300 },
    { label: 'Refunds', value: -50 },
    { label: 'Expenses', value: -120 },
    { label: 'Bonus', value: 80 },
    { label: 'Closing', value: 710, type: 'total' },
  ]),
};

// h2: Large Values (K/M formatting)
export const LargeValuesFormatting: Story = {
  render: () => makeWaterfall({ 'show-values': true, 'show-connectors': true }, [
    { label: 'Revenue', value: 5000000, type: 'total' },
    { label: 'Costs', value: -2500000 },
    { label: 'Tax', value: -750000 },
    { label: 'Net', value: 1750000, type: 'total' },
  ]),
};

// h2: Many Bars (12)
export const ManyBars12: Story = {
  render: () => {
    const data = [
      { label: 'Start', value: 1000, type: 'total' },
      { label: 'Step 1', value: 150 },
      { label: 'Step 2', value: -80 },
      { label: 'Step 3', value: 200 },
      { label: 'Step 4', value: -120 },
      { label: 'Step 5', value: 90 },
      { label: 'Step 6', value: -50 },
      { label: 'Step 7', value: 180 },
      { label: 'Step 8', value: -30 },
      { label: 'Step 9', value: 110 },
      { label: 'Step 10', value: -70 },
      { label: 'End', value: 1280, type: 'total' },
    ];
    return makeWaterfall({ 'show-values': true, 'show-connectors': true }, data);
  },
};

// h2: Two Bars
export const TwoBars: Story = {
  render: () => makeWaterfall({ 'show-values': true, 'show-connectors': true }, [
    { label: 'Before', value: 100, type: 'total' },
    { label: 'After', value: 250, type: 'total' },
  ]),
};

// h2: Single Bar (total)
export const SingleBarTotal: Story = {
  render: () => makeWaterfall({ 'show-values': true }, [
    { label: 'Total', value: 500, type: 'total' },
  ]),
};

// h2: Negative Result
export const NegativeResult: Story = {
  render: () => makeWaterfall({ 'show-values': true, 'show-connectors': true }, [
    { label: 'Opening', value: 200, type: 'total' },
    { label: 'Loss A', value: -150 },
    { label: 'Loss B', value: -120 },
    { label: 'Closing', value: -70, type: 'total' },
  ]),
};

// h2: Empty Data
export const EmptyData: Story = {
  render: () => makeWaterfall({ 'show-values': true, 'show-connectors': true }, []),
};

// h2: CSS Parts Styling
// Available parts: base, chart
export const CSSPartsStyling: Story = {
  render: () => {
    const style = document.createElement('style');
    style.textContent = `
      .waterfall-parts-demo { display: flex; flex-direction: column; gap: 2rem; }
      .waterfall-parts-demo__item { display: flex; flex-direction: column; gap: 0.5rem; }
      .waterfall-parts-demo__label { font-size: 0.7rem; color: #888; font-family: monospace; }

      /* Styled: ::part(base) - outermost container */
      .waterfall-parts-demo--styled snice-waterfall::part(base) {
        background: linear-gradient(135deg, #0c0a1e 0%, #1a1040 100%);
        border-radius: 14px;
        padding: 16px;
        border: 1px solid rgba(139,92,246,0.3);
        box-shadow: 0 8px 40px rgba(139,92,246,0.2);
      }

      /* Styled: ::part(chart) - the chart rendering area */
      .waterfall-parts-demo--styled snice-waterfall::part(chart) {
        filter: saturate(1.4) brightness(1.1);
        border-radius: 8px;
        overflow: hidden;
      }
    `;

    const container = document.createElement('div');
    container.appendChild(style);

    const wrap = document.createElement('div');
    wrap.className = 'waterfall-parts-demo';

    // Default
    const defaultItem = document.createElement('div');
    defaultItem.className = 'waterfall-parts-demo__item';
    const defaultLabel = document.createElement('div');
    defaultLabel.className = 'waterfall-parts-demo__label';
    defaultLabel.textContent = 'default';
    defaultItem.appendChild(defaultLabel);
    defaultItem.appendChild(makeWaterfall({ 'show-values': true, 'show-connectors': true }, profitLoss));

    // Styled
    const styledItem = document.createElement('div');
    styledItem.className = 'waterfall-parts-demo__item waterfall-parts-demo--styled';
    const styledLabel = document.createElement('div');
    styledLabel.className = 'waterfall-parts-demo__label';
    styledLabel.textContent = '::part(base) ::part(chart)';
    styledItem.appendChild(styledLabel);
    styledItem.appendChild(makeWaterfall({ 'show-values': true, 'show-connectors': true }, profitLoss));

    wrap.appendChild(defaultItem);
    wrap.appendChild(styledItem);
    container.appendChild(wrap);
    return container;
  },
};

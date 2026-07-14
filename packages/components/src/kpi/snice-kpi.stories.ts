import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-kpi';
import type { KpiSentiment, KpiSize } from './snice-kpi.types';

type Args = {
  label?: string;
  value?: string | number;
  trendValue?: string | number;
  sentiment?: KpiSentiment;
  size?: KpiSize;
  showSparkline?: boolean;
  colorValue?: boolean;
};

const SIZES: KpiSize[] = ['small', 'medium', 'large'];
const SENTIMENTS: KpiSentiment[] = ['up', 'down', 'neutral'];

const TREND_UP   = [10, 12, 15, 14, 18, 22, 25, 28, 30, 35];
const TREND_DOWN = [50, 48, 45, 42, 38, 35, 30, 28, 25, 20];
const TREND_FLAT = [20, 21, 19, 20, 22, 20, 21, 19, 20, 21];

function makeKpi(attrs: Record<string, string | boolean> = {}, trendData?: number[]): HTMLElement {
  const el = document.createElement('snice-kpi');
  el.style.cssText = 'border:1px solid var(--snice-color-border,#e2e2e2);border-radius:8px;';
  for (const [k, v] of Object.entries(attrs)) {
    if (typeof v === 'boolean') { if (v) el.toggleAttribute(k, true); }
    else el.setAttribute(k, v);
  }
  if (trendData) (el as any).trendData = trendData;
  return el;
}

function row(...els: HTMLElement[]): HTMLElement {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;align-items:flex-start;gap:1.5rem;flex-wrap:wrap;';
  els.forEach(el => wrap.appendChild(el));
  return wrap;
}

function grid(...els: HTMLElement[]): HTMLElement {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:1rem;';
  els.forEach(el => wrap.appendChild(el));
  return wrap;
}

const meta: Meta<Args> = {
  title: 'Kpi',
  component: 'snice-kpi',
  tags: ['autodocs'],
  argTypes: {
    label:        { control: 'text' },
    value:        { control: 'text' },
    trendValue:   { control: 'text' },
    sentiment:    { control: 'select', options: SENTIMENTS },
    size:         { control: 'select', options: SIZES },
    showSparkline:{ control: 'boolean' },
    colorValue:   { control: 'boolean' },
  },
  render: (args) => {
    const el = document.createElement('snice-kpi');
    el.style.cssText = 'border:1px solid var(--snice-color-border,#e2e2e2);border-radius:8px;display:inline-block;';
    if (args.label       !== undefined) el.setAttribute('label',       String(args.label));
    if (args.value       !== undefined) el.setAttribute('value',       String(args.value));
    if (args.trendValue  !== undefined) el.setAttribute('trend-value', String(args.trendValue));
    if (args.sentiment   !== undefined) el.setAttribute('sentiment',   String(args.sentiment));
    if (args.size        !== undefined) el.setAttribute('size',        String(args.size));
    if (args.colorValue)  el.toggleAttribute('color-value',  true);
    if (args.showSparkline === false) el.setAttribute('show-sparkline', 'false');
    return el;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = { args: { label: 'Revenue', value: '$12,340', sentiment: 'up', trendValue: '+8.2%', size: 'medium' } };

// h2: Size: small
export const SizeSmall: Story = {
  render: () => row(makeKpi({ size: 'small', label: 'Revenue', value: '$12,340', sentiment: 'up', 'trend-value': '+8.2%' })),
};

// h2: Size: medium (default)
export const SizeMediumDefault: Story = {
  render: () => row(makeKpi({ size: 'medium', label: 'Revenue', value: '$12,340', sentiment: 'up', 'trend-value': '+8.2%' })),
};

// h2: Size: large
export const SizeLarge: Story = {
  render: () => row(makeKpi({ size: 'large', label: 'Revenue', value: '$12,340', sentiment: 'up', 'trend-value': '+8.2%' })),
};

// h2: All Sizes Compared
export const AllSizesCompared: Story = {
  render: () => row(
    makeKpi({ size: 'small',  label: 'Small',  value: '$5K',  sentiment: 'up', 'trend-value': '+3%' }),
    makeKpi({ size: 'medium', label: 'Medium', value: '$12K', sentiment: 'up', 'trend-value': '+8%' }),
    makeKpi({ size: 'large',  label: 'Large',  value: '$45K', sentiment: 'up', 'trend-value': '+15%' }),
  ),
};

// h2: Sentiment: up
export const SentimentUp: Story = {
  render: () => row(makeKpi({ label: 'Users', value: '14,532', sentiment: 'up', 'trend-value': '+12.5%' })),
};

// h2: Sentiment: down
export const SentimentDown: Story = {
  render: () => row(makeKpi({ label: 'Churn Rate', value: '3.2%', sentiment: 'down', 'trend-value': '-0.8%' })),
};

// h2: Sentiment: neutral
export const SentimentNeutral: Story = {
  render: () => row(makeKpi({ label: 'Avg Session', value: '4m 32s', sentiment: 'neutral', 'trend-value': '0%' })),
};

// h2: No Sentiment
export const NoSentiment: Story = {
  render: () => row(makeKpi({ label: 'Total Orders', value: '1,247' })),
};

// h2: All Sentiments Compared
export const AllSentimentsCompared: Story = {
  render: () => grid(
    makeKpi({ label: 'Revenue',     value: '$89K',  sentiment: 'up',      'trend-value': '+12%' }),
    makeKpi({ label: 'Bounce Rate', value: '42%',   sentiment: 'down',    'trend-value': '-5%' }),
    makeKpi({ label: 'DAU',         value: '2,340', sentiment: 'neutral', 'trend-value': '0%' }),
    makeKpi({ label: 'Signups',     value: '567' }),
  ),
};

// h2: colorValue: true
export const ColorValueTrue: Story = {
  render: () => grid(
    makeKpi({ label: 'Growth',  value: '+24%', sentiment: 'up',      'trend-value': '+24%', 'color-value': '' }),
    makeKpi({ label: 'Decline', value: '-8%',  sentiment: 'down',    'trend-value': '-8%',  'color-value': '' }),
    makeKpi({ label: 'Stable',  value: '0%',   sentiment: 'neutral', 'trend-value': '0%',   'color-value': '' }),
  ),
};

// h2: colorValue: false (default)
export const ColorValueFalseDefault: Story = {
  render: () => grid(
    makeKpi({ label: 'Growth',  value: '+24%', sentiment: 'up',   'trend-value': '+24%' }),
    makeKpi({ label: 'Decline', value: '-8%',  sentiment: 'down', 'trend-value': '-8%' }),
  ),
};

// h2: Sparkline (showSparkline: true, default)
export const SparklineShowSparklineTrue: Story = {
  render: () => grid(
    makeKpi({ label: 'Revenue',         value: '$89K', sentiment: 'up',      'trend-value': '+12%' }, TREND_UP),
    makeKpi({ label: 'Support Tickets', value: '342',  sentiment: 'down',    'trend-value': '-18%' }, TREND_DOWN),
    makeKpi({ label: 'DAU',             value: '2,340', sentiment: 'neutral', 'trend-value': '0%' }, TREND_FLAT),
  ),
};

// h2: showSparkline: false
export const ShowSparklineFalse: Story = {
  render: () => grid(
    makeKpi({ label: 'Revenue', value: '$89K', sentiment: 'up',   'trend-value': '+12%', 'show-sparkline': 'false' }, TREND_UP),
    makeKpi({ label: 'Tickets', value: '342',  sentiment: 'down', 'trend-value': '-18%', 'show-sparkline': 'false' }, TREND_DOWN),
  ),
};

// h2: Trend Value Only (no sentiment)
export const TrendValueOnlyNoSentiment: Story = {
  render: () => row(makeKpi({ label: 'Conversion', value: '3.4%', 'trend-value': 'vs 2.8% last month' })),
};

// h2: Slot: before
export const SlotBefore: Story = {
  render: () => {
    const el = makeKpi({ label: 'Active Users', value: '12,450', sentiment: 'up', 'trend-value': '+5%' });
    const before = document.createElement('span');
    before.slot = 'before';
    before.style.fontSize = '1.5rem';
    before.textContent = '👥';
    el.appendChild(before);
    return row(el);
  },
};

// h2: Slot: after
export const SlotAfter: Story = {
  render: () => {
    const el = makeKpi({ label: 'Server Load', value: '67%', sentiment: 'neutral' });
    const after = document.createElement('div');
    after.slot = 'after';
    after.style.cssText = 'font-size:.7rem;color:var(--snice-color-text-tertiary);padding:0 .75rem .75rem;';
    after.textContent = 'Last updated: 2 min ago';
    el.appendChild(after);
    return row(el);
  },
};

// h2: Numeric Value (number type)
export const NumericValueNumberType: Story = {
  render: () => row(makeKpi({ label: 'Count', value: '42' })),
};

// h2: Size x Sentiment Matrix
export const SizeXSentimentMatrix: Story = {
  render: () => grid(
    makeKpi({ size: 'small',  label: 'S/Up',      value: '$5K',   sentiment: 'up',      'trend-value': '+3%' }),
    makeKpi({ size: 'small',  label: 'S/Down',    value: '28',    sentiment: 'down',    'trend-value': '-2' }),
    makeKpi({ size: 'small',  label: 'S/Neutral', value: '99%',   sentiment: 'neutral', 'trend-value': '0%' }),
    makeKpi({ size: 'medium', label: 'M/Up',      value: '$12K',  sentiment: 'up',      'trend-value': '+8%' }),
    makeKpi({ size: 'medium', label: 'M/Down',    value: '142',   sentiment: 'down',    'trend-value': '-12' }),
    makeKpi({ size: 'medium', label: 'M/Neutral', value: '4.2s',  sentiment: 'neutral', 'trend-value': '0%' }),
    makeKpi({ size: 'large',  label: 'L/Up',      value: '$89K',  sentiment: 'up',      'trend-value': '+24%' }),
    makeKpi({ size: 'large',  label: 'L/Down',    value: '3.8%',  sentiment: 'down',    'trend-value': '-0.5%' }),
    makeKpi({ size: 'large',  label: 'L/Neutral', value: '2,340', sentiment: 'neutral', 'trend-value': '0%' }),
  ),
};

// h2: Edge: Long Value and Label
export const EdgeLongValueAndLabel: Story = {
  render: () => row(makeKpi({ label: 'Average Revenue Per User Per Quarter', value: '$1,234,567.89', sentiment: 'up', 'trend-value': '+123.45%' })),
};

// h2: Edge: Minimal (label + value only)
export const EdgeMinimalLabelValueOnly: Story = {
  render: () => row(makeKpi({ label: 'Total', value: '42' })),
};

// h2: Full Combination: sparkline + sentiment + colorValue + slots
export const FullCombinationSparklineSentimentColorValueSlots: Story = {
  render: () => {
    const el = makeKpi({ label: 'MRR', value: '$45,200', sentiment: 'up', 'trend-value': '+18.3%', 'color-value': '' }, TREND_UP);
    const before = document.createElement('span');
    before.slot = 'before';
    before.style.fontSize = '1.5rem';
    before.textContent = '💰';
    const after = document.createElement('div');
    after.slot = 'after';
    after.style.cssText = 'font-size:.7rem;color:var(--snice-color-text-tertiary);padding:0 .75rem .75rem;';
    after.textContent = 'Target: $50,000';
    el.appendChild(before);
    el.appendChild(after);
    return row(el);
  },
};

// h2: CSS Parts Styling
// Parts: container, header, main, label, value, trend, trend-icon, trend-value, sparkline
export const CSSPartsStyling: Story = {
  render: () => {
    const style = document.createElement('style');
    style.textContent = `
      .parts-demo { display: flex; gap: 1.5rem; flex-wrap: wrap; padding: 1rem; align-items: flex-start; }
      .parts-demo .item { display: flex; flex-direction: column; gap: .4rem; }
      .parts-demo .label { font-size: .65rem; color: #888; font-weight: 600; text-transform: uppercase; }

      /* ::part(container) — outer KPI card */
      .parts-demo snice-kpi.styled::part(container) {
        background: linear-gradient(135deg, #0f172a, #1e293b);
        border: 1px solid #334155;
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(0,0,0,.4);
      }

      /* ::part(header) — header section */
      .parts-demo snice-kpi.styled::part(header) {
        padding: 1rem 1rem .5rem;
      }

      /* ::part(main) — label + value block */
      .parts-demo snice-kpi.styled::part(main) {
        gap: .25rem;
      }

      /* ::part(label) — metric label */
      .parts-demo snice-kpi.styled::part(label) {
        color: #64748b;
        font-size: .7rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: .1em;
      }

      /* ::part(value) — the big number */
      .parts-demo snice-kpi.styled::part(value) {
        color: #f1f5f9;
        font-size: 2rem;
        font-weight: 900;
        letter-spacing: -.04em;
        line-height: 1;
      }

      /* ::part(trend) — trend wrapper */
      .parts-demo snice-kpi.styled::part(trend) {
        background: rgba(16,185,129,.15);
        border: 1px solid rgba(16,185,129,.3);
        border-radius: 1rem;
        padding: .15rem .6rem;
        align-self: flex-start;
        margin-top: .25rem;
      }

      /* ::part(trend-icon) — arrow icon */
      .parts-demo snice-kpi.styled::part(trend-icon) {
        color: #10b981;
        font-size: 1rem;
      }

      /* ::part(trend-value) — "+12%" text */
      .parts-demo snice-kpi.styled::part(trend-value) {
        color: #10b981;
        font-weight: 700;
        font-size: .8rem;
      }

      /* ::part(sparkline) — sparkline chart area */
      .parts-demo snice-kpi.styled::part(sparkline) {
        border-top: 1px solid #1e293b;
        padding: .5rem 1rem;
        opacity: .8;
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

    const def = makeKpi({ label: 'Revenue', value: '$45,200', sentiment: 'up', 'trend-value': '+12%', 'show-sparkline': '' }, TREND_UP);
    demo.appendChild(makeItem('default', def));

    const styled = makeKpi({ label: 'Revenue', value: '$45,200', sentiment: 'up', 'trend-value': '+12%', 'show-sparkline': '' }, TREND_UP);
    styled.className = 'styled';
    demo.appendChild(makeItem('all parts styled (dark)', styled));

    wrap.appendChild(demo);
    return wrap;
  },
};

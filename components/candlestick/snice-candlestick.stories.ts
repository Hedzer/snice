import type { Meta, StoryObj } from '@storybook/web-components-vite';
import './snice-candlestick';

type Args = {
  showVolume?: boolean;
  showGrid?: boolean;
  showCrosshair?: boolean;
  zoomEnabled?: boolean;
  animation?: boolean;
  bullishColor?: string;
  bearishColor?: string;
  timeFormat?: string;
  yAxisFormat?: string;
};

function generateCandles(count: number, startDate: string, startPrice: number) {
  const data: { date: string; open: number; high: number; low: number; close: number; volume: number }[] = [];
  let price = startPrice;
  const d = new Date(startDate);
  for (let i = 0; i < count; i++) {
    const open = price + (Math.random() - 0.5) * 5;
    const close = open + (Math.random() - 0.5) * 8;
    const high = Math.max(open, close) + Math.random() * 3;
    const low = Math.min(open, close) - Math.random() * 3;
    const volume = Math.floor(Math.random() * 1000000) + 100000;
    data.push({
      date: new Date(d).toISOString(),
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume,
    });
    d.setDate(d.getDate() + 1);
    price = close;
  }
  return data;
}

const data60 = generateCandles(60, '2024-01-01', 150);
const data5 = generateCandles(5, '2024-06-01', 100);
const data200 = generateCandles(200, '2023-06-01', 50);

function makeChart(attrs: Record<string, string | boolean>, data: object[], style?: string) {
  const el = document.createElement('snice-candlestick');
  for (const [k, v] of Object.entries(attrs)) {
    if (typeof v === 'boolean') {
      if (v) el.toggleAttribute(k, true);
      else el.setAttribute(k, 'false');
    } else {
      el.setAttribute(k, String(v));
    }
  }
  el.style.cssText = style ?? 'display:block;width:100%;height:350px;';
  (el as any).data = data;
  return el;
}

const meta: Meta<Args> = {
  title: 'Charts/Candlestick',
  component: 'snice-candlestick',
  tags: ['autodocs'],
  argTypes: {
    showVolume: { control: 'boolean' },
    showGrid: { control: 'boolean' },
    showCrosshair: { control: 'boolean' },
    zoomEnabled: { control: 'boolean' },
    animation: { control: 'boolean' },
    bullishColor: { control: 'color' },
    bearishColor: { control: 'color' },
    timeFormat: { control: 'select', options: ['auto', 'date', 'datetime', 'month'] },
    yAxisFormat: { control: 'select', options: ['number', 'currency', 'percent'] },
  },
  render: (args) => {
    const el = document.createElement('snice-candlestick');
    if (args.showVolume) el.toggleAttribute('show-volume', true);
    if (args.showGrid !== undefined) el.setAttribute('show-grid', String(args.showGrid));
    if (args.showCrosshair !== undefined) el.setAttribute('show-crosshair', String(args.showCrosshair));
    if (args.zoomEnabled !== undefined) el.setAttribute('zoom-enabled', String(args.zoomEnabled));
    if (args.animation !== undefined) el.setAttribute('animation', String(args.animation));
    if (args.bullishColor !== undefined) el.setAttribute('bullish-color', String(args.bullishColor));
    if (args.bearishColor !== undefined) el.setAttribute('bearish-color', String(args.bearishColor));
    if (args.timeFormat !== undefined) el.setAttribute('time-format', String(args.timeFormat));
    if (args.yAxisFormat !== undefined) el.setAttribute('y-axis-format', String(args.yAxisFormat));
    el.style.cssText = 'display:block;width:100%;height:350px;';
    (el as any).data = data60;
    return el;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = { args: {} };

// h2: Default (showGrid=true, showCrosshair=true, zoomEnabled=true, animation=true)
export const DefaultShowGridCrosshairZoomAnimation: Story = {
  render: () => makeChart({}, data60),
};

// h2: showVolume: true
export const ShowVolumeTrue: Story = {
  render: () => makeChart({ 'show-volume': true }, data60),
};

// h2: showGrid: false
export const ShowGridFalse: Story = {
  render: () => makeChart({ 'show-grid': false }, data60),
};

// h2: showCrosshair: false
export const ShowCrosshairFalse: Story = {
  render: () => makeChart({ 'show-crosshair': false }, data60),
};

// h2: zoomEnabled: false
export const ZoomEnabledFalse: Story = {
  render: () => makeChart({ 'zoom-enabled': false }, data60),
};

// h2: animation: false
export const AnimationFalse: Story = {
  render: () => makeChart({ animation: false }, data60),
};

// h2: Custom colors (bullishColor, bearishColor)
export const CustomColors: Story = {
  render: () => makeChart({ 'bullish-color': '#22c55e', 'bearish-color': '#ef4444' }, data60),
};

// h2: All timeFormat values
export const AllTimeFormatValues: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;';
    const formats: [string, string][] = [
      ['auto', 'timeFormat: auto (default)'],
      ['date', 'timeFormat: date'],
      ['datetime', 'timeFormat: datetime'],
      ['month', 'timeFormat: month'],
    ];
    formats.forEach(([fmt, lbl]) => {
      const item = document.createElement('div');
      const label = document.createElement('div');
      label.style.cssText = 'font-size:0.7rem;color:var(--snice-color-text-tertiary);margin-bottom:0.25rem;';
      label.textContent = lbl;
      item.appendChild(label);
      const data = fmt === 'month' ? data200.filter((_, i) => i % 5 === 0) : data60;
      item.appendChild(makeChart({ 'time-format': fmt }, data, 'display:block;width:100%;height:300px;'));
      wrap.appendChild(item);
    });
    return wrap;
  },
};

// h2: All yAxisFormat values
export const AllYAxisFormatValues: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;';
    const percentData = generateCandles(40, '2024-01-01', 5).map(c => ({
      ...c,
      open: c.open / 30,
      high: c.high / 30,
      low: c.low / 30,
      close: c.close / 30,
    }));
    const formats: [string, string, object[]][] = [
      ['number', 'yAxisFormat: number (default)', data60],
      ['currency', 'yAxisFormat: currency', data60],
      ['percent', 'yAxisFormat: percent', percentData],
    ];
    formats.forEach(([fmt, lbl, data]) => {
      const item = document.createElement('div');
      const label = document.createElement('div');
      label.style.cssText = 'font-size:0.7rem;color:var(--snice-color-text-tertiary);margin-bottom:0.25rem;';
      label.textContent = lbl;
      item.appendChild(label);
      item.appendChild(makeChart({ 'y-axis-format': fmt }, data as any[], 'display:block;width:100%;height:300px;'));
      wrap.appendChild(item);
    });
    return wrap;
  },
};

// h2: Volume + Custom colors + Grid
export const VolumeCustomColorsGrid: Story = {
  render: () => makeChart({ 'show-volume': true, 'bullish-color': '#3b82f6', 'bearish-color': '#f97316' }, data60),
};

// h2: Small dataset (5 candles)
export const SmallDataset5Candles: Story = {
  render: () => makeChart({}, data5, 'display:block;width:100%;height:250px;'),
};

// h2: Large dataset (200 candles)
export const LargeDataset200Candles: Story = {
  render: () => makeChart({ 'show-volume': true }, data200),
};

// h2: CSS Parts Styling
// Available parts: base, canvas, tooltip
export const CSSPartsStyling: Story = {
  render: () => {
    const style = document.createElement('style');
    style.textContent = `
      .candle-parts-demo { display: flex; flex-direction: column; gap: 2rem; }
      .candle-parts-demo__item { display: flex; flex-direction: column; gap: 0.5rem; }
      .candle-parts-demo__label { font-size: 0.7rem; color: #888; font-family: monospace; }

      /* Styled: ::part(base) - outer container */
      .candle-parts-demo--styled snice-candlestick::part(base) {
        background: #0a0a0f;
        border-radius: 12px;
        padding: 12px;
        border: 1px solid rgba(16,185,129,0.3);
        box-shadow: 0 0 40px rgba(16,185,129,0.1);
      }

      /* Styled: ::part(canvas) - the SVG drawing surface */
      .candle-parts-demo--styled snice-candlestick::part(canvas) {
        border-radius: 8px;
        outline: 1px solid rgba(16,185,129,0.2);
      }

      /* Styled: ::part(tooltip) - hover crosshair tooltip */
      .candle-parts-demo--styled snice-candlestick::part(tooltip) {
        background: #064e3b;
        color: #6ee7b7;
        border: 1px solid #10b981;
        border-radius: 6px;
        padding: 6px 12px;
        font-size: 0.75rem;
        font-weight: 600;
        font-family: monospace;
        box-shadow: 0 4px 16px rgba(16,185,129,0.3);
      }
    `;

    const container = document.createElement('div');
    container.appendChild(style);

    const wrap = document.createElement('div');
    wrap.className = 'candle-parts-demo';

    // Default
    const defaultItem = document.createElement('div');
    defaultItem.className = 'candle-parts-demo__item';
    const defaultLabel = document.createElement('div');
    defaultLabel.className = 'candle-parts-demo__label';
    defaultLabel.textContent = 'default';
    defaultItem.appendChild(defaultLabel);
    defaultItem.appendChild(makeChart({}, data60));

    // Styled
    const styledItem = document.createElement('div');
    styledItem.className = 'candle-parts-demo__item candle-parts-demo--styled';
    const styledLabel = document.createElement('div');
    styledLabel.className = 'candle-parts-demo__label';
    styledLabel.textContent = '::part(base) ::part(canvas) ::part(tooltip)';
    styledItem.appendChild(styledLabel);
    styledItem.appendChild(makeChart({ 'bullish-color': '#10b981', 'bearish-color': '#ef4444' }, data60));

    wrap.appendChild(defaultItem);
    wrap.appendChild(styledItem);
    container.appendChild(wrap);
    return container;
  },
};

<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/candlestick.md -->

# Candlestick Chart Component

SVG-based OHLC (Open-High-Low-Close) financial chart for stock market and cryptocurrency price visualization. Supports volume bars, crosshair overlay, zoom/pan, tooltips, and responsive sizing.

## Table of Contents
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [CSS Custom Properties](#css-custom-properties)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Accessibility](#accessibility)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `data` | `CandleData[]` | `[]` | Array of candlestick data points |
| `showVolume` (attr: `show-volume`) | `boolean` | `false` | Show volume bars below the price chart |
| `showGrid` (attr: `show-grid`) | `boolean` | `true` | Show horizontal grid lines |
| `showCrosshair` (attr: `show-crosshair`) | `boolean` | `true` | Show crosshair overlay on hover |
| `bullishColor` (attr: `bullish-color`) | `string` | `''` | Custom color for bullish candles (close >= open) |
| `bearishColor` (attr: `bearish-color`) | `string` | `''` | Custom color for bearish candles (close < open) |
| `timeFormat` (attr: `time-format`) | `string` | `'auto'` | Date format: `'auto'`, `'date'`, `'time'`, `'datetime'`, `'month'`, `'year'` |
| `yAxisFormat` (attr: `y-axis-format`) | `string` | `'number'` | Y-axis format: `'number'`, `'currency'`, `'percent'` |
| `zoomEnabled` (attr: `zoom-enabled`) | `boolean` | `true` | Enable scroll-to-zoom and drag-to-pan |
| `animation` | `boolean` | `true` | Animate candle appearance on data change |

### CandleData Interface

```typescript
interface CandleData {
  date: string | number | Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}
```

## Methods

| Method | Arguments | Returns | Description |
|--------|-----------|---------|-------------|
| `resetZoom()` | -- | `void` | Reset zoom to show all data points |
| `zoomTo()` | `startIndex: number, endIndex: number` | `void` | Zoom to a specific index range |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `candle-click` | `{ candle: CandleData, index: number }` | A candle was clicked |
| `candle-hover` | `{ candle: CandleData, index: number }` | Mouse entered a candle |
| `crosshair-move` | `{ price: number, date: string, x: number, y: number }` | Crosshair position changed |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--snice-candlestick-bullish` | `rgb(22 163 74)` | Bullish candle color |
| `--snice-candlestick-bearish` | `rgb(220 38 38)` | Bearish candle color |

## CSS Parts

| Part | Description |
|------|-------------|
| `base` | Outer chart container with mouse event handlers |
| `canvas` | SVG element containing the candlestick chart, grid, and axes |
| `tooltip` | OHLC data tooltip overlay shown on hover |

## Basic Usage

```html
<snice-candlestick id="chart"></snice-candlestick>
```

```typescript
import 'snice/components/candlestick/snice-candlestick';

chart.data = [
  { date: '2024-01-01', open: 100, high: 110, low: 95, close: 105, volume: 500000 },
  { date: '2024-01-02', open: 105, high: 115, low: 100, close: 98, volume: 600000 },
  { date: '2024-01-03', open: 98, high: 108, low: 93, close: 107, volume: 450000 },
];
```

## Examples

### With Volume Bars

Set `show-volume` to display volume bars below the price chart.

```html
<snice-candlestick show-volume></snice-candlestick>
```

### Custom Colors

Use `bullish-color` and `bearish-color` to customize candle colors.

```html
<snice-candlestick bullish-color="#0088ff" bearish-color="#ff6600"></snice-candlestick>
```

### Currency Format

Use `y-axis-format="currency"` for stock price display.

```html
<snice-candlestick y-axis-format="currency" show-volume></snice-candlestick>
```

### Minimal Display

Disable grid and crosshair for a minimal chart.

```html
<snice-candlestick show-grid="false" show-crosshair="false"></snice-candlestick>
```

### Zoom Controls

Use `resetZoom()` and `zoomTo()` for programmatic zoom control.

```html
<button onclick="chart.resetZoom()">Reset Zoom</button>
<button onclick="chart.zoomTo(0, 30)">First 30 Days</button>
<snice-candlestick id="chart" zoom-enabled></snice-candlestick>
```

### Event Handling

Listen for candle clicks and crosshair movement.

```javascript
chart.addEventListener('candle-click', (e) => {
  console.log('Clicked candle:', e.detail.candle);
});

chart.addEventListener('crosshair-move', (e) => {
  console.log('Price at cursor:', e.detail.price);
});
```

### Dynamic Data Updates

Set `data` to a new array to update the chart in real time.

```javascript
setInterval(() => {
  const data = [...chart.data];
  const last = data[data.length - 1];
  const open = last.close;
  const close = open + (Math.random() - 0.5) * 10;
  data.push({
    date: new Date(),
    open,
    high: Math.max(open, close) + Math.random() * 3,
    low: Math.min(open, close) - Math.random() * 3,
    close,
    volume: Math.floor(Math.random() * 1000000)
  });
  chart.data = data;
}, 5000);
```

## Accessibility

- SVG has `role="img"` with `aria-label` including data point count
- Default bullish (green) and bearish (red) colors meet WCAG AA contrast standards
- Zoom and pan are mouse-driven; use `resetZoom()` and `zoomTo()` for programmatic control

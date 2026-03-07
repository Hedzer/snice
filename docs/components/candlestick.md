<!-- AI: For a low-token version of this doc, use docs/ai/components/candlestick.md instead -->

# Candlestick Chart Component

The candlestick chart component renders an SVG-based OHLC (Open-High-Low-Close) financial chart, commonly used for stock market and cryptocurrency price visualization. It supports volume bars, crosshair overlay, zoom/pan, tooltips, and responsive sizing.

## Table of Contents
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [CSS Custom Properties](#css-custom-properties)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Accessibility](#accessibility)
- [Browser Support](#browser-support)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `data` | `CandleData[]` | `[]` | Array of candlestick data points |
| `show-volume` | `boolean` | `false` | Show volume bars below the price chart |
| `show-grid` | `boolean` | `true` | Show horizontal grid lines |
| `show-crosshair` | `boolean` | `true` | Show crosshair overlay on hover |
| `bullish-color` | `string` | `''` | Custom color for bullish candles (close >= open) |
| `bearish-color` | `string` | `''` | Custom color for bearish candles (close < open) |
| `time-format` | `string` | `'auto'` | Date format: `'auto'`, `'date'`, `'time'`, `'datetime'`, `'month'`, `'year'` |
| `y-axis-format` | `string` | `'number'` | Y-axis format: `'number'`, `'currency'`, `'percent'` |
| `zoom-enabled` | `boolean` | `true` | Enable scroll-to-zoom and drag-to-pan |
| `animation` | `boolean` | `true` | Animate candle appearance on data change |

### CandleData Interface

```typescript
interface CandleData {
  date: string | number | Date;   // Timestamp or date string
  open: number;                     // Opening price
  high: number;                     // Highest price
  low: number;                      // Lowest price
  close: number;                    // Closing price
  volume?: number;                  // Trading volume (optional)
}
```

## Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `resetZoom()` | `() => void` | Reset zoom to show all data points |
| `zoomTo()` | `(startIndex: number, endIndex: number) => void` | Zoom to a specific index range |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `candle-click` | `{ candle: CandleData, index: number }` | A candle was clicked |
| `candle-hover` | `{ candle: CandleData, index: number }` | Mouse entered a candle |
| `crosshair-move` | `{ price: number, date: string, x: number, y: number }` | Crosshair position changed |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--snice-candlestick-bullish` | `rgb(22 163 74)` (green) | Bullish candle color |
| `--snice-candlestick-bearish` | `rgb(220 38 38)` (red) | Bearish candle color |

You can also override colors globally using these CSS custom properties:

```css
snice-candlestick {
  --snice-candlestick-bullish: #26a69a;
  --snice-candlestick-bearish: #ef5350;
}
```

## CSS Parts

Style internal elements from outside the shadow DOM using `::part()`.

| Part | Element | Description |
|------|---------|-------------|
| `base` | `<div>` | Outer chart container with mouse event handlers |
| `canvas` | `<svg>` | SVG element containing the candlestick chart, grid, and axes |
| `tooltip` | `<div>` | OHLC data tooltip overlay shown on hover |

```css
snice-candlestick::part(base) {
  border-radius: 8px;
  background: #0f172a;
}

snice-candlestick::part(tooltip) {
  background: rgba(15, 23, 42, 0.95);
  border-radius: 6px;
  font-size: 0.8rem;
}
```

## Basic Usage

```html
<snice-candlestick id="chart"></snice-candlestick>

<script type="module">
  import 'snice/components/candlestick/snice-candlestick';

  const chart = document.getElementById('chart');
  chart.data = [
    { date: '2024-01-01', open: 100, high: 110, low: 95, close: 105, volume: 500000 },
    { date: '2024-01-02', open: 105, high: 115, low: 100, close: 98, volume: 600000 },
    { date: '2024-01-03', open: 98, high: 108, low: 93, close: 107, volume: 450000 },
  ];
</script>
```

## Examples

### With Volume Bars

```html
<snice-candlestick id="vol-chart" show-volume></snice-candlestick>
```

### Custom Colors

```html
<snice-candlestick bullish-color="#0088ff" bearish-color="#ff6600"></snice-candlestick>
```

### Currency Format (Stock Prices)

```html
<snice-candlestick id="stock-chart" y-axis-format="currency" show-volume></snice-candlestick>

<script>
  stockChart.data = [
    { date: '2024-01-02', open: 42500, high: 42850, low: 42200, close: 42700, volume: 15000000 },
    // ...
  ];
</script>
```

### Minimal (No Grid, No Crosshair)

```html
<snice-candlestick show-grid="false" show-crosshair="false"></snice-candlestick>
```

### Zoom Controls

```html
<button onclick="chart.resetZoom()">Reset Zoom</button>
<button onclick="chart.zoomTo(0, 30)">First 30 Days</button>
<snice-candlestick id="chart" zoom-enabled></snice-candlestick>
```

### Listening to Events

```html
<snice-candlestick id="chart"></snice-candlestick>

<script>
  chart.addEventListener('candle-click', (e) => {
    console.log('Clicked candle:', e.detail.candle);
    console.log('Index:', e.detail.index);
  });

  chart.addEventListener('crosshair-move', (e) => {
    console.log('Price at cursor:', e.detail.price);
    console.log('Date at cursor:', e.detail.date);
  });
</script>
```

### Dynamic Data Updates

```html
<snice-candlestick id="live-chart" show-volume></snice-candlestick>

<script>
  // Add new candle every 5 seconds
  setInterval(() => {
    const data = [...liveChart.data];
    const last = data[data.length - 1];
    const change = (Math.random() - 0.5) * 10;
    const open = last.close;
    const close = open + change;
    data.push({
      date: new Date(),
      open,
      high: Math.max(open, close) + Math.random() * 3,
      low: Math.min(open, close) - Math.random() * 3,
      close,
      volume: Math.floor(Math.random() * 1000000)
    });
    liveChart.data = data;
  }, 5000);
</script>
```

## Accessibility

- **ARIA role**: The SVG has `role="img"` for screen reader identification
- **ARIA label**: Includes data point count in `aria-label`
- **Keyboard**: Zoom and pan are mouse-driven; use `resetZoom()` and `zoomTo()` methods for programmatic control
- **Color contrast**: Default bullish (green) and bearish (red) colors meet WCAG AA standards

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires Custom Elements v1 and Shadow DOM support

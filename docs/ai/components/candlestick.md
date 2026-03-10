# snice-candlestick

SVG-based OHLC candlestick chart for financial data visualization.

## Properties

```typescript
data: CandleData[] = [];                // {date, open, high, low, close, volume?}
showVolume: boolean = false;            // attribute: show-volume
showGrid: boolean = true;              // attribute: show-grid
showCrosshair: boolean = true;         // attribute: show-crosshair
bullishColor: string = '';             // attribute: bullish-color
bearishColor: string = '';             // attribute: bearish-color
timeFormat: 'auto'|'date'|'time'|'datetime'|'month'|'year' = 'auto'; // attribute: time-format
yAxisFormat: 'number'|'currency'|'percent' = 'number'; // attribute: y-axis-format
zoomEnabled: boolean = true;           // attribute: zoom-enabled
animation: boolean = true;
```

## Methods

- `resetZoom()` - Reset zoom to show all data
- `zoomTo(startIndex: number, endIndex: number)` - Zoom to index range

## Events

- `candle-click` -> `{ candle: CandleData, index: number }`
- `candle-hover` -> `{ candle: CandleData, index: number }`
- `crosshair-move` -> `{ price: number, date: string, x: number, y: number }`

## CSS Custom Properties

- `--snice-candlestick-bullish` - Bullish candle color (default: green)
- `--snice-candlestick-bearish` - Bearish candle color (default: red)

## CSS Parts

- `base` - Outer chart container
- `canvas` - SVG chart element
- `tooltip` - OHLC tooltip overlay

## Basic Usage

```html
<snice-candlestick show-volume></snice-candlestick>
```

```typescript
import 'snice/components/candlestick/snice-candlestick';

chart.data = [
  { date: '2024-01-01', open: 100, high: 110, low: 95, close: 105, volume: 500000 },
  { date: '2024-01-02', open: 105, high: 115, low: 100, close: 98, volume: 600000 },
];
```

## Accessibility

- SVG: role="img" with aria-label
- WCAG AA contrast for default colors

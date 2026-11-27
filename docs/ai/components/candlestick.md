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
- `chart-content` - SVG `<g>` holding grid, axes, volume, and candles
- `grid-line` - Horizontal grid line
- `axis-label` - Axis tick label
- `axis-label-y` - Added to `axis-label` on the price axis
- `axis-label-x` - Added to `axis-label` on the time axis
- `wick` - High/low wick line of a candle
- `wick-bullish` - Added to `wick` when the candle closed up
- `wick-bearish` - Added to `wick` when the candle closed down
- `candle` - Open/close body rect of a candle
- `candle-bullish` - Added to `candle` when the candle closed up
- `candle-bearish` - Added to `candle` when the candle closed down
- `volume-bar` - Volume bar beneath the price chart
- `volume-bar-bullish` - Added to `volume-bar` when the candle closed up
- `volume-bar-bearish` - Added to `volume-bar` when the candle closed down
- `crosshair` - SVG `<g>` holding the crosshair overlay
- `crosshair-line` - A crosshair line
- `crosshair-line-horizontal` - Added to `crosshair-line` on the price line
- `crosshair-line-vertical` - Added to `crosshair-line` on the time line
- `crosshair-label-background` - Backing rect behind a crosshair label
- `crosshair-label` - Crosshair price/date label text
- `tooltip-row` - One row inside the tooltip
- `tooltip-label` - Row label inside the tooltip
- `tooltip-value` - Row value inside the tooltip
- `tooltip-value-bullish` - Added to `tooltip-value` on an up close
- `tooltip-value-bearish` - Added to `tooltip-value` on a down close

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

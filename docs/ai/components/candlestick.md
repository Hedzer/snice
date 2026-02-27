# snice-candlestick

SVG-based OHLC candlestick chart for financial data visualization.

## Properties

```typescript
data: CandleData[] = [];              // {date, open, high, low, close, volume?}
showVolume: boolean = false;           // Show volume bars below chart
showGrid: boolean = true;             // Show horizontal grid lines
showCrosshair: boolean = true;        // Show crosshair on hover
bullishColor: string = '';            // Custom bullish (close >= open) color
bearishColor: string = '';            // Custom bearish (close < open) color
timeFormat: 'auto'|'date'|'time'|'datetime'|'month'|'year' = 'auto';
yAxisFormat: 'number'|'currency'|'percent' = 'number';
zoomEnabled: boolean = true;          // Enable scroll zoom and drag pan
animation: boolean = true;            // Animate candle appearance
```

## Types

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

```typescript
resetZoom(): void;                     // Show all data
zoomTo(startIndex: number, endIndex: number): void;  // Zoom to range
```

## Events

```typescript
'candle-click': { candle: CandleData; index: number }
'candle-hover': { candle: CandleData; index: number }
'crosshair-move': { price: number; date: string; x: number; y: number }
```

## Usage

```html
<snice-candlestick id="chart" show-volume></snice-candlestick>

<script>
  chart.data = [
    { date: '2024-01-01', open: 100, high: 110, low: 95, close: 105, volume: 500000 },
    { date: '2024-01-02', open: 105, high: 115, low: 100, close: 98, volume: 600000 },
  ];
</script>
```

## Features

- SVG candlestick bodies with wicks (high/low shadows)
- Green bullish / red bearish coloring (customizable)
- Optional volume bars below price chart
- Horizontal grid lines
- Y-axis price labels (number/currency/percent)
- X-axis date labels with smart formatting
- Crosshair with price/date readout
- OHLC + volume tooltip on hover
- Scroll to zoom, drag to pan
- Responsive via ResizeObserver
- Entrance animation with staggered delays
- Accessible: role="img" with aria-label

**CSS Parts:**
- `base` - Outer chart container div
- `canvas` - SVG element containing the candlestick chart
- `tooltip` - OHLC tooltip overlay div

## CSS Custom Properties

- `--snice-candlestick-bullish` — bullish candle color (default: green)
- `--snice-candlestick-bearish` — bearish candle color (default: red)

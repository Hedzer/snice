# snice-waterfall

Waterfall chart (bridge chart) showing cumulative effect of sequential positive/negative values.

## Properties

```typescript
data: WaterfallDataPoint[] = [];
orientation: 'vertical'|'horizontal' = 'vertical';
showValues: boolean = true;     // attr: show-values
showConnectors: boolean = true; // attr: show-connectors
animated: boolean = false;

interface WaterfallDataPoint {
  label: string;
  value: number;
  type?: 'increase'|'decrease'|'total';  // auto-detected from value sign if omitted
}
```

## Events

- `bar-click` -> `{ item: WaterfallDataPoint, index: number }`
- `bar-hover` -> `{ item: WaterfallDataPoint, index: number }`

## CSS Custom Properties

- `--snice-color-success` - Increase bar fill (default: `rgb(22 163 74)`)
- `--snice-color-danger` - Decrease bar fill (default: `rgb(220 38 38)`)
- `--snice-color-primary` - Total bar fill (default: `rgb(37 99 235)`)
- `--snice-color-text-secondary` - Label text color
- `--snice-color-text-tertiary` - Connector line color
- `--snice-color-border` - Zero-line axis color (default: `rgb(226 226 226)`)
- `--snice-transition-fast` - Bar hover transition (default: `150ms`)
- `--snice-font-weight-medium` - Value text weight

## CSS Parts

- `base` - Main waterfall container
- `chart` - Chart rendering area
- `svg` - Root `<svg>` of the chart
- `axis` - Zero-value axis line
- `connector` - Connector line between consecutive bars
- `bar` - A waterfall bar
- `bar-increase` - Added to `bar` for an increase bar
- `bar-decrease` - Added to `bar` for a decrease bar
- `bar-total` - Added to `bar` for a total bar
- `bar-animated` - Added to `bar` while `animated` is set
- `label` - Category label text under or beside a bar
- `value` - Value text on a bar
- `value-increase` - Added to `value` for an increase bar
- `value-decrease` - Added to `value` for a decrease bar
- `value-total` - Added to `value` for a total bar

## Basic Usage

```html
<snice-waterfall show-values show-connectors></snice-waterfall>
```

```typescript
chart.data = [
  { label: 'Start', value: 1000, type: 'total' },
  { label: 'Revenue', value: 500 },
  { label: 'Costs', value: -200 },
  { label: 'Tax', value: -100 },
  { label: 'End', value: 1200, type: 'total' }
];

chart.addEventListener('bar-click', (e) => {
  console.log(`Clicked: ${e.detail.item.label} (${e.detail.item.value})`);
});
```

## Accessibility

- Bars carry data-visualization roles, are focusable, and activate by keyboard
- `showValues` exposes value labels as screen-reader text
- Bar types distinguishable by color *and* value label, not color alone
- Animations respect `prefers-reduced-motion`

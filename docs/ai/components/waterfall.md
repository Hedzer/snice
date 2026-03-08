# snice-waterfall

Waterfall chart (bridge chart) showing cumulative effect of sequential positive/negative values.

## Properties

```ts
data: WaterfallDataPoint[] = []
orientation: 'vertical' | 'horizontal' = 'vertical'
showValues: boolean = true     // attribute: show-values
showConnectors: boolean = true // attribute: show-connectors
animated: boolean = false

interface WaterfallDataPoint {
  label: string
  value: number
  type?: 'increase' | 'decrease' | 'total'  // auto-detected from value sign if omitted
}
```

## Events

- `bar-click` → `{ item: WaterfallDataPoint; index: number }` — bar clicked
- `bar-hover` → `{ item: WaterfallDataPoint; index: number }` — bar hovered

## CSS Custom Properties

- `--snice-color-success` - Increase bar fill (default: `rgb(22 163 74)`)
- `--snice-color-danger` - Decrease bar fill (default: `rgb(220 38 38)`)
- `--snice-color-primary` - Total bar fill (default: `rgb(37 99 235)`)
- `--snice-color-text-secondary` - Label text color
- `--snice-color-text-tertiary` - Connector line color
- `--snice-color-border` - Zero-line axis color (default: `rgb(226 226 226)`)
- `--snice-transition-fast` - Bar hover transition (default: `150ms`)
- `--snice-font-weight-medium` - Value text weight

## Usage

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

**CSS Parts:**
- `base` - Main waterfall container
- `chart` - Chart rendering area

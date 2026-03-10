<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/waterfall.md -->

# Waterfall
`<snice-waterfall>`

Renders a waterfall chart (bridge chart) that visualizes the cumulative effect of sequential positive and negative values. Bars are color-coded by type: green for increases, red for decreases, and blue for totals.

## Table of Contents
- [Properties](#properties)
- [Events](#events)
- [CSS Custom Properties](#css-custom-properties)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Accessibility](#accessibility)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `data` | `WaterfallDataPoint[]` | `[]` | Array of data points to render |
| `orientation` | `'vertical' \| 'horizontal'` | `'vertical'` | Chart orientation |
| `showValues` (attr: `show-values`) | `boolean` | `true` | Display value labels on bars |
| `showConnectors` (attr: `show-connectors`) | `boolean` | `true` | Show connector lines between bars |
| `animated` | `boolean` | `false` | Animate bars on render |

### WaterfallDataPoint Interface

```typescript
interface WaterfallDataPoint {
  label: string;
  value: number;
  type?: 'increase' | 'decrease' | 'total';  // auto-detected from value sign if omitted
}
```

When `type` is omitted, it is automatically determined: positive values render as `increase` (green) and negative values render as `decrease` (red). Use `type: 'total'` explicitly for summary bars.

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `bar-click` | `{ item: WaterfallDataPoint, index: number }` | Bar clicked |
| `bar-hover` | `{ item: WaterfallDataPoint, index: number }` | Mouse entered a bar |

## CSS Custom Properties

| Property | Description | Default |
|----------|-------------|---------|
| `--snice-color-success` | Increase bar fill color | `rgb(22 163 74)` |
| `--snice-color-danger` | Decrease bar fill color | `rgb(220 38 38)` |
| `--snice-color-primary` | Total bar fill color | `rgb(37 99 235)` |
| `--snice-color-text-secondary` | Label text color | _(theme default)_ |
| `--snice-color-text-tertiary` | Connector line color | _(theme default)_ |
| `--snice-color-border` | Zero-line axis color | `rgb(226 226 226)` |
| `--snice-transition-fast` | Bar hover transition speed | `150ms` |
| `--snice-font-weight-medium` | Value text font weight | _(theme default)_ |

## CSS Parts

| Part | Description |
|------|-------------|
| `base` | The main waterfall container |
| `chart` | The chart rendering area |

## Basic Usage

```typescript
import 'snice/components/waterfall/snice-waterfall';
```

```html
<snice-waterfall show-values show-connectors></snice-waterfall>
```

```typescript
chart.data = [
  { label: 'Starting Balance', value: 1000, type: 'total' },
  { label: 'Revenue', value: 500 },
  { label: 'Costs', value: -200 },
  { label: 'Tax', value: -100 },
  { label: 'Net Income', value: 1200, type: 'total' }
];
```

## Examples

### Profit and Loss

Show how revenue, costs, and taxes contribute to a final balance.

```typescript
chart.data = [
  { label: 'Starting Balance', value: 1000, type: 'total' },
  { label: 'Revenue', value: 500 },
  { label: 'Services', value: 300 },
  { label: 'Costs', value: -200 },
  { label: 'Wages', value: -350 },
  { label: 'Tax', value: -100 },
  { label: 'Net Income', value: 1150, type: 'total' }
];
```

### Horizontal Orientation

Use the `orientation` attribute to render the chart horizontally.

```html
<snice-waterfall orientation="horizontal" show-values></snice-waterfall>
```

### Animated Chart

Use the `animated` attribute to animate bars when the chart renders.

```html
<snice-waterfall animated show-values show-connectors></snice-waterfall>
```

### Bar Click Handling

Listen for bar clicks to display details or navigate to related views.

```typescript
chart.addEventListener('bar-click', (e) => {
  const { item, index } = e.detail;
  console.log(`Clicked: ${item.label} = ${item.value}`);
});
```

### Without Connectors or Values

Hide connector lines and value labels for a cleaner visual.

```html
<snice-waterfall></snice-waterfall>
```

```typescript
chart.showValues = false;
chart.showConnectors = false;
```

## Accessibility

- Bars use appropriate roles for data visualization
- Value labels provide screen reader text when `showValues` is enabled
- Bar types are distinguishable by color and value labels
- Bars are focusable and clickable via keyboard
- Animations respect `prefers-reduced-motion`

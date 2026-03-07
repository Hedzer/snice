<!-- AI: For a low-token version of this doc, use docs/ai/components/waterfall.md instead -->

# Waterfall Component

The waterfall component renders a waterfall chart (also known as a bridge chart) that visualizes the cumulative effect of sequential positive and negative values. Bars are color-coded by type: green for increases, red for decreases, and blue for totals, with optional connector lines and value labels.

## Table of Contents
- [Basic Usage](#basic-usage)
- [Properties](#properties)
- [Events](#events)
- [CSS Custom Properties](#css-custom-properties)
- [Examples](#examples)
- [Accessibility](#accessibility)

## Basic Usage

```html
<snice-waterfall></snice-waterfall>
```

```typescript
import 'snice/components/waterfall/snice-waterfall';
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `data` | `WaterfallDataPoint[]` | `[]` | Array of data points to render |
| `orientation` | `'vertical' \| 'horizontal'` | `'vertical'` | Chart orientation |
| `showValues` (attr: `show-values`) | `boolean` | `true` | Display value labels on bars |
| `showConnectors` (attr: `show-connectors`) | `boolean` | `true` | Show connector lines between bars |
| `animated` | `boolean` | `false` | Animate bars on render |

### WaterfallDataPoint

```typescript
interface WaterfallDataPoint {
  label: string;                                      // Bar label text
  value: number;                                      // Numeric value
  type?: 'increase' | 'decrease' | 'total';           // Bar type (auto-detected from value sign if omitted)
}
```

When `type` is omitted, it is automatically determined: positive values render as `increase` (green) and negative values render as `decrease` (red). Use `type: 'total'` explicitly for summary bars.

## Events

### `bar-click`
Fired when a bar is clicked.

**Event Detail:**
```typescript
{
  item: WaterfallDataPoint;
  index: number;
}
```

### `bar-hover`
Fired when the mouse enters a bar.

**Event Detail:**
```typescript
{
  item: WaterfallDataPoint;
  index: number;
}
```

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

Style internal elements from outside the shadow DOM using `::part()`.

| Part | Element | Description |
|------|---------|-------------|
| `base` | `<div>` | The main waterfall container |
| `chart` | `<div>` | The chart rendering area |

```css
snice-waterfall::part(base) {
  border-radius: 8px;
  overflow: hidden;
}

snice-waterfall::part(chart) {
  padding: 1rem;
}
```

## Examples

### Profit & Loss Waterfall

Show how revenue, costs, and taxes contribute to a final balance.

```html
<snice-waterfall id="pnl-chart" show-values show-connectors></snice-waterfall>

<script type="module">
  import 'snice/components/waterfall/snice-waterfall';

  const chart = document.getElementById('pnl-chart');
  chart.data = [
    { label: 'Starting Balance', value: 1000, type: 'total' },
    { label: 'Revenue', value: 500 },
    { label: 'Services', value: 300 },
    { label: 'Costs', value: -200 },
    { label: 'Wages', value: -350 },
    { label: 'Tax', value: -100 },
    { label: 'Net Income', value: 1150, type: 'total' }
  ];
</script>
```

### Horizontal Orientation

Render the waterfall chart horizontally instead of vertically.

```html
<snice-waterfall id="horizontal-chart" orientation="horizontal" show-values></snice-waterfall>

<script type="module">
  const chart = document.getElementById('horizontal-chart');
  chart.data = [
    { label: 'Q1 Start', value: 5000, type: 'total' },
    { label: 'Sales', value: 2000 },
    { label: 'Returns', value: -300 },
    { label: 'Marketing', value: -800 },
    { label: 'Q1 End', value: 5900, type: 'total' }
  ];
</script>
```

### Animated Chart

Use the `animated` property to animate bars when the chart renders.

```html
<snice-waterfall id="animated-chart" animated show-values show-connectors></snice-waterfall>

<script type="module">
  const chart = document.getElementById('animated-chart');
  chart.data = [
    { label: 'January', value: 10000, type: 'total' },
    { label: 'New Subscriptions', value: 3500 },
    { label: 'Upgrades', value: 1200 },
    { label: 'Churn', value: -2100 },
    { label: 'Refunds', value: -400 },
    { label: 'February', value: 12200, type: 'total' }
  ];
</script>
```

### Bar Click Handling

Listen for bar clicks to display details or navigate to related views.

```html
<snice-waterfall id="clickable-chart" show-values></snice-waterfall>
<p id="click-info">Click a bar to see details.</p>

<script type="module">
  const chart = document.getElementById('clickable-chart');
  const info = document.getElementById('click-info');

  chart.data = [
    { label: 'Budget', value: 50000, type: 'total' },
    { label: 'Hiring', value: -15000 },
    { label: 'Equipment', value: -8000 },
    { label: 'Revenue', value: 20000 },
    { label: 'Remaining', value: 47000, type: 'total' }
  ];

  chart.addEventListener('bar-click', (e) => {
    const { item, index } = e.detail;
    info.textContent = `Clicked: ${item.label} = ${item.value > 0 ? '+' : ''}${item.value}`;
  });
</script>
```

### Without Connectors or Values

Hide connector lines and value labels for a cleaner visual.

```html
<snice-waterfall id="clean-chart"></snice-waterfall>

<script type="module">
  const chart = document.getElementById('clean-chart');
  chart.showValues = false;
  chart.showConnectors = false;
  chart.data = [
    { label: 'Start', value: 100, type: 'total' },
    { label: 'Add', value: 40 },
    { label: 'Remove', value: -25 },
    { label: 'Add', value: 15 },
    { label: 'End', value: 130, type: 'total' }
  ];
</script>
```

## Accessibility

- **ARIA roles**: Bars use appropriate roles for data visualization
- **Value labels**: When `showValues` is enabled, values are displayed as text for screen readers
- **Color and text**: Bar types are distinguishable not only by color but also by their value labels (positive/negative numbers)
- **Keyboard support**: Bars are focusable and clickable via keyboard
- **Reduced motion**: When `animated` is set, animations respect `prefers-reduced-motion`

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires Custom Elements v1 and Shadow DOM support

## Best Practices

1. **Always include total bars**: Start and end with `type: 'total'` bars so viewers can see the full picture
2. **Use meaningful labels**: Labels should clearly describe what each bar represents
3. **Keep data sets manageable**: 5-10 bars work well; more than 15 can become hard to read
4. **Show connectors for clarity**: Connector lines help viewers trace the cumulative flow between bars
5. **Let type auto-detect when possible**: Omit `type` for regular increase/decrease bars; only specify `type: 'total'` explicitly
6. **Use animation for presentations**: The `animated` option works well for slide decks and dashboards where data loads dynamically
7. **Choose orientation based on labels**: Use `horizontal` when labels are long; `vertical` when labels are short

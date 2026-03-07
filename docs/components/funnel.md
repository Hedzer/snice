<!-- AI: For a low-token version of this doc, use docs/ai/components/funnel.md instead -->

# Funnel Component

The funnel component renders an SVG-based funnel/conversion chart, ideal for visualizing pipeline stages, conversion funnels, and drop-off analysis. Each stage is rendered as a trapezoid shape that narrows proportionally to its value.

## Table of Contents
- [Basic Usage](#basic-usage)
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [Examples](#examples)
- [Accessibility](#accessibility)
- [Best Practices](#best-practices)

## Basic Usage

```html
<snice-funnel id="my-funnel"></snice-funnel>

<script type="module">
  import 'snice/components/funnel/snice-funnel';

  const funnel = document.getElementById('my-funnel');
  funnel.data = [
    { label: 'Visitors', value: 10000 },
    { label: 'Leads', value: 5000 },
    { label: 'Opportunities', value: 2000 },
    { label: 'Customers', value: 500 },
  ];
</script>
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `data` | `FunnelStage[]` | `[]` | Array of stage objects with label, value, and optional color |
| `variant` | `'default' \| 'gradient'` | `'default'` | Color variant - default uses distinct colors, gradient uses opacity fade |
| `orientation` | `'vertical' \| 'horizontal'` | `'vertical'` | Funnel layout direction |
| `show-labels` | `boolean` | `true` | Whether to display stage labels |
| `show-values` | `boolean` | `true` | Whether to display stage values |
| `show-percentages` | `boolean` | `true` | Whether to display conversion percentages |
| `animation` | `boolean` | `false` | Whether to animate stages on initial render |

### FunnelStage Interface

```typescript
interface FunnelStage {
  label: string;     // Stage name (e.g., "Visitors")
  value: number;     // Numeric value for the stage
  color?: string;    // Optional custom color (CSS color string)
}
```

## Methods

| Method | Return Type | Description |
|--------|-------------|-------------|
| `setStages(stages)` | `void` | Set funnel data programmatically (alternative to setting `data` property) |
| `exportImage(format?)` | `string` | Export the funnel as a data URL. Format: `'png'` (default) or `'svg'` |

### Export Example

```javascript
const funnel = document.getElementById('my-funnel');

// Export as SVG
const svgDataUrl = funnel.exportImage('svg');

// Export as PNG
const pngDataUrl = funnel.exportImage('png');
```

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `funnel-click` | `{ stage: FunnelStage, index: number }` | Fired when a stage is clicked |
| `funnel-hover` | `{ stage: FunnelStage, index: number }` | Fired when a stage is hovered |

```javascript
funnel.addEventListener('funnel-click', (e) => {
  console.log('Clicked stage:', e.detail.stage.label);
  console.log('Stage index:', e.detail.index);
});
```

## Examples

### Conversion Funnel

```html
<snice-funnel id="conversion"></snice-funnel>
<script>
  document.getElementById('conversion').data = [
    { label: 'Website Visits', value: 50000 },
    { label: 'Sign Ups', value: 12000 },
    { label: 'Trial Started', value: 5000 },
    { label: 'Paid', value: 1500 },
    { label: 'Retained', value: 800 },
  ];
</script>
```

### Gradient Variant

The gradient variant uses decreasing opacity of the primary color for a smoother visual effect.

```html
<snice-funnel id="gradient-funnel" variant="gradient"></snice-funnel>
```

### Custom Colors

```html
<snice-funnel id="colored-funnel"></snice-funnel>
<script>
  document.getElementById('colored-funnel').data = [
    { label: 'Awareness', value: 10000, color: 'rgb(37 99 235)' },
    { label: 'Interest', value: 6000, color: 'rgb(22 163 74)' },
    { label: 'Decision', value: 2500, color: 'rgb(234 179 8)' },
    { label: 'Action', value: 1000, color: 'rgb(220 38 38)' },
  ];
</script>
```

### Horizontal Layout

```html
<snice-funnel id="horizontal" orientation="horizontal"></snice-funnel>
```

### With Animation

```html
<snice-funnel id="animated" animation></snice-funnel>
```

### Minimal Display

```html
<snice-funnel id="minimal" show-labels="false" show-percentages="false"></snice-funnel>
```

### Event Handling

```html
<snice-funnel id="interactive"></snice-funnel>
<div id="output"></div>

<script>
  const funnel = document.getElementById('interactive');
  const output = document.getElementById('output');

  funnel.data = [
    { label: 'Step 1', value: 1000 },
    { label: 'Step 2', value: 600 },
    { label: 'Step 3', value: 200 },
  ];

  funnel.addEventListener('funnel-click', (e) => {
    output.textContent = `Clicked: ${e.detail.stage.label} (${e.detail.stage.value})`;
  });
</script>
```

## CSS Parts

Style internal elements from outside the shadow DOM using `::part()`.

| Part | Element | Description |
|------|---------|-------------|
| `base` | `<div>` | Outer funnel container |
| `chart` | `<div>` | SVG chart rendering area |
| `tooltip` | `<div>` | Hover tooltip element |

```css
snice-funnel::part(base) {
  padding: 1rem;
}

snice-funnel::part(tooltip) {
  font-size: 0.875rem;
}
```

## Accessibility

- **ARIA role**: The SVG has `role="img"` with `aria-label="Funnel chart"`
- **Interactive stages**: Each stage has `role="button"` and `tabindex="0"` for keyboard navigation
- **ARIA labels**: Each stage has a descriptive `aria-label` including the label, value, and percentage
- **Keyboard support**: Stages can be activated with Enter or Space keys
- **Focus styles**: Visible focus ring on keyboard navigation
- **Color contrast**: Default colors meet WCAG AA standards

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires Custom Elements v1 and Shadow DOM support

## Best Practices

1. **Order data by value**: Place the largest value first for a natural funnel shape
2. **Use meaningful labels**: Stage labels should clearly describe each step in the process
3. **Limit stages**: 3-7 stages works best visually; more than 8 becomes hard to read
4. **Choose colors wisely**: Use custom colors to match your brand or highlight important stages
5. **Include percentages**: Conversion percentages help users understand drop-off rates
6. **Use animation sparingly**: Enable animation for initial page load or dashboard reveals
7. **Consider orientation**: Vertical works well for sidebar placement; horizontal for wide layouts
8. **Handle click events**: Use click events to drill down into stage details
9. **Format values**: Large numbers are automatically formatted (K/M notation)
10. **Test responsiveness**: The SVG scales with its container width

[//]: # (AI: For a low-token version of this doc, use docs/ai/components/kpi.md instead)

# KPI Component

A key performance indicator display component for showing metrics with optional trend visualization and sentiment indicators. Perfect for dashboards and analytics interfaces.

> **Note**: The `snice-stat` component has been merged into `snice-kpi`. All stat functionality is now available through KPI.

## Features

- **Clear Value Display**: Large, prominent metric value
- **Icon Support**: Optional icon slot for visual branding
- **Trend Indicators**: Optional trend value with sentiment icons
- **Sparkline Integration**: Built-in sparkline chart support
- **Sentiment Colors**: Visual feedback with up/down/neutral states
- **Multiple Sizes**: Small, medium, and large variants
- **Flexible Layout**: Responsive and adaptable to different layouts

## Basic Usage

```html
<snice-kpi
  label="Total Revenue"
  value="$45,231">
</snice-kpi>
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `label` | `string` | `''` | Label text (metric name) |
| `value` | `string \| number` | `''` | Main metric value to display |
| `trend-value` | `string \| number` | `undefined` | Optional trend value (e.g., "+12.5%") |
| `trend-data` | `number[]` | `undefined` | Data for sparkline chart |
| `sentiment` | `KpiSentiment` | `undefined` | Trend sentiment ('up', 'down', 'neutral') |
| `size` | `KpiSize` | `'medium'` | Component size ('small', 'medium', 'large') |
| `show-sparkline` | `boolean` | `true` | Whether to show sparkline when data is provided |
| `color-value` | `boolean` | `false` | Apply sentiment color to main value |

## Slots

| Slot | Description |
|------|-------------|
| `before` | Content displayed before the label/value (e.g., icons) |
| `after` | Content displayed after sparkline (e.g., additional actions) |

## With Icon (Before Slot)

```html
<snice-kpi
  label="Total Revenue"
  value="$45,231"
  trend-value="+12%"
  sentiment="up">
  <div slot="before" style="display: flex; align-items: center; justify-content: center; width: 2.5rem; height: 2.5rem; background: var(--snice-color-primary-subtle); border-radius: var(--snice-border-radius-md); margin-bottom: var(--snice-spacing-xs);">
    <svg style="width: 1.5rem; height: 1.5rem; color: var(--snice-color-primary); fill: currentColor;" viewBox="0 0 24 24">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
    </svg>
  </div>
</snice-kpi>
```

## With Trend Indicator

```html
<snice-kpi
  label="Monthly Revenue"
  value="$54,239"
  trend-value="+12.5%"
  sentiment="up">
</snice-kpi>
```

## With Sparkline

```html
<snice-kpi
  id="sales"
  label="Weekly Sales"
  value="$28,450"
  trend-value="+15.3%"
  sentiment="up">
</snice-kpi>

<script>
  document.getElementById('sales').trendData = [
    20, 25, 22, 30, 28, 35, 32, 38, 36, 42, 40, 45, 43, 48
  ];
</script>
```

## Sentiment Variants

### Up (Positive)
```html
<snice-kpi
  label="Profit Margin"
  value="34.2%"
  trend-value="+3.5%"
  sentiment="up">
</snice-kpi>
```

### Down (Attention Needed)
```html
<snice-kpi
  label="Churn Rate"
  value="2.3%"
  trend-value="+0.8%"
  sentiment="down">
</snice-kpi>
```

### Neutral (Stable)
```html
<snice-kpi
  label="Market Share"
  value="28.5%"
  trend-value="±0%"
  sentiment="neutral">
</snice-kpi>
```

## Sizes

### Small
```html
<snice-kpi
  label="Active Users"
  value="1,234"
  size="small">
</snice-kpi>
```

### Medium (Default)
```html
<snice-kpi
  label="Active Users"
  value="1,234"
  size="medium">
</snice-kpi>
```

### Large
```html
<snice-kpi
  label="Active Users"
  value="1,234"
  size="large">
</snice-kpi>
```

## CSS Parts

Use `::part()` to style internal elements:

```css
snice-kpi::part(container) {
  border: 2px solid #e0e0e0;
}

snice-kpi::part(label) {
  text-transform: uppercase;
}

snice-kpi::part(value) {
  color: #2563eb;
}

snice-kpi::part(trend) {
  font-weight: 700;
}
```

## Theming

The component uses these CSS custom properties:

```css
--snice-color-background
--snice-color-border
--snice-color-text
--snice-color-text-secondary
--snice-color-success
--snice-color-danger
--snice-spacing-*
--snice-font-size-*
--snice-font-weight-*
--snice-border-radius-md
```

## Examples

### Dashboard Metrics
```html
<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
  <snice-kpi
    id="revenue"
    label="Monthly Revenue"
    value="$127,450"
    trend-value="+22.4%"
    sentiment="up">
  </snice-kpi>

  <snice-kpi
    id="users"
    label="Active Users"
    value="2,345"
    trend-value="+8.7%"
    sentiment="up">
  </snice-kpi>

  <snice-kpi
    id="conversion"
    label="Conversion Rate"
    value="3.24%"
    trend-value="-0.5%"
    sentiment="down">
  </snice-kpi>
</div>

<script>
  document.getElementById('revenue').trendData = [20, 25, 30, 28, 35, 40, 45];
  document.getElementById('users').trendData = [100, 120, 110, 150, 140, 170, 160];
  document.getElementById('conversion').trendData = [3.5, 3.3, 3.4, 3.2, 3.3, 3.1, 3.24];
</script>
```

### Without Sparkline
```html
<snice-kpi
  label="Customer Satisfaction"
  value="4.8/5"
  trend-value="+0.2"
  sentiment="up"
  show-sparkline="false">
</snice-kpi>
```

### Complex Metrics
```html
<snice-kpi
  id="nps"
  label="Net Promoter Score"
  value="72"
  trend-value="+4 pts"
  sentiment="up">
</snice-kpi>

<snice-kpi
  id="cac"
  label="Customer Acquisition Cost"
  value="$156"
  trend-value="-5.2%"
  sentiment="down">
</snice-kpi>
```

## Best Practices

1. **Use Clear Labels**: Make metric names concise and understandable
2. **Format Values**: Present numbers in a readable format ($45K vs $45231.50)
3. **Consistent Sentiment**: Use 'down' for bad news even if the number decreased (e.g., costs going down is good, but use 'down' for the direction)
4. **Group Related KPIs**: Display related metrics together for context
5. **Update Regularly**: Keep metrics fresh with real-time or frequent updates

## Accessibility

- Labels provide context for displayed values
- Sentiment indicators have clear visual differentiation (color + icon)
- Sufficient color contrast for all text elements

## Performance

- Lightweight component with minimal DOM
- Efficient sparkline rendering via SVG
- CSS containment for optimized rendering
- No external dependencies beyond sparkline component

<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/kpi.md -->

# KPI Component

A key performance indicator display component for showing metrics with optional trend visualization and sentiment indicators. Perfect for dashboards and analytics interfaces.

> **Note**: The `snice-stat` component has been merged into `snice-kpi`. All stat functionality is now available through KPI.

## Table of Contents
- [Properties](#properties)
- [Slots](#slots)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Accessibility](#accessibility)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `label` | `string` | `''` | Label text (metric name) |
| `value` | `string \| number` | `''` | Main metric value to display |
| `trendValue` (attr: `trend-value`) | `string \| number` | `undefined` | Optional trend value (e.g., "+12.5%") |
| `trendData` | `number[]` | `undefined` | Data for sparkline chart (set via JavaScript) |
| `sentiment` | `'up' \| 'down' \| 'neutral'` | `undefined` | Trend sentiment |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Component size |
| `showSparkline` (attr: `show-sparkline`) | `boolean` | `true` | Whether to show sparkline when data is provided |
| `colorValue` (attr: `color-value`) | `boolean` | `false` | Apply sentiment color to main value |

## Slots

| Slot | Description |
|------|-------------|
| `before` | Content displayed before the label/value (e.g., icons) |
| `after` | Content displayed after sparkline (e.g., additional actions) |

## CSS Parts

| Part | Description |
|------|-------------|
| `container` | Main KPI container |
| `header` | Header section |
| `main` | Main content area (label + value) |
| `label` | Label text |
| `value` | Value text |
| `trend` | Trend indicator container |
| `trend-icon` | Trend icon (arrow) |
| `trend-value` | Trend value text |
| `sparkline` | Sparkline chart container |

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

## Basic Usage

```typescript
import 'snice/components/kpi/snice-kpi';
```

```html
<snice-kpi
  label="Total Revenue"
  value="$45,231">
</snice-kpi>
```

## Examples

### With Trend Indicator

```html
<snice-kpi
  label="Monthly Revenue"
  value="$54,239"
  trend-value="+12.5%"
  sentiment="up">
</snice-kpi>
```

### With Sparkline

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

### With Icon (Before Slot)

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

### Sentiment Variants

```html
<!-- Up (Positive) -->
<snice-kpi
  label="Profit Margin"
  value="34.2%"
  trend-value="+3.5%"
  sentiment="up">
</snice-kpi>

<!-- Down (Attention Needed) -->
<snice-kpi
  label="Churn Rate"
  value="2.3%"
  trend-value="+0.8%"
  sentiment="down">
</snice-kpi>

<!-- Neutral (Stable) -->
<snice-kpi
  label="Market Share"
  value="28.5%"
  trend-value="±0%"
  sentiment="neutral">
</snice-kpi>
```

### Sizes

```html
<snice-kpi label="Active Users" value="1,234" size="small"></snice-kpi>
<snice-kpi label="Active Users" value="1,234" size="medium"></snice-kpi>
<snice-kpi label="Active Users" value="1,234" size="large"></snice-kpi>
```

## Accessibility

- Labels provide context for displayed values
- Sentiment indicators have clear visual differentiation (color + icon)
- Sufficient color contrast for all text elements

# snice-kpi

Key performance indicator display with value, label, trend, sparkline, and sentiment.

> `snice-stat` has been merged into `snice-kpi`.

## Properties

```typescript
label: string = '';
value: string | number = '';
trendValue?: string | number;          // attr: trend-value
trendData?: number[];                  // Sparkline data array (JS only, attribute: false)
sentiment?: KpiSentiment;              // 'up' | 'down' | 'neutral'
size: KpiSize = 'medium';             // 'small' | 'medium' | 'large'
showSparkline: boolean = true;         // attr: show-sparkline
colorValue: boolean = false;           // attr: color-value — apply sentiment color to value
```

## Slots

- `before` - Content before label/value (e.g., icons)
- `after` - Content after sparkline (e.g., actions)

## CSS Parts

- `container` - Main container
- `header` - Header section
- `main` - Main content (label + value)
- `label` - Label text
- `value` - Value text
- `trend` - Trend container
- `trend-icon` - Trend icon (up/down/neutral arrow)
- `trend-value` - Trend value text
- `sparkline` - Sparkline container

## Basic Usage

```typescript
import 'snice/components/kpi/snice-kpi';
```

```html
<!-- Basic -->
<snice-kpi label="Revenue" value="$45,231"></snice-kpi>

<!-- With trend -->
<snice-kpi
  label="Monthly Revenue"
  value="$54,239"
  trend-value="+12.5%"
  sentiment="up">
</snice-kpi>

<!-- With sparkline -->
<snice-kpi
  id="sales"
  label="Weekly Sales"
  value="$28,450"
  trend-value="+15.3%"
  sentiment="up">
</snice-kpi>
```

```typescript
sales.trendData = [20, 25, 22, 30, 28, 35, 32];
```

```html
<!-- Sentiments -->
<snice-kpi sentiment="up"></snice-kpi>     <!-- Green, arrow up -->
<snice-kpi sentiment="down"></snice-kpi>   <!-- Red, arrow down -->
<snice-kpi sentiment="neutral"></snice-kpi> <!-- Gray, arrow right -->

<!-- Sizes -->
<snice-kpi size="small"></snice-kpi>
<snice-kpi size="medium"></snice-kpi>
<snice-kpi size="large"></snice-kpi>

<!-- Without sparkline -->
<snice-kpi show-sparkline="false"></snice-kpi>

<!-- With icon slot -->
<snice-kpi label="Revenue" value="$45,231">
  <div slot="before">icon here</div>
</snice-kpi>
```

## Accessibility

- Labels provide context for values
- Sentiment: color + icon differentiation
- Sufficient color contrast

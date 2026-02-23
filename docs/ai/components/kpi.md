# snice-kpi

Key performance indicator display with value, label, trend, sparkline, and sentiment.

> **Note**: `snice-stat` component has been merged into `snice-kpi`.

## Properties

```typescript
label: string = ''                      // Metric label/name
value: string | number = ''             // Main metric value
trendValue?: string | number            // attribute: trend-value
trendData?: number[]                    // Sparkline data array (JS only)
sentiment?: KpiSentiment                // 'up' | 'down' | 'neutral'
size: KpiSize = 'medium'                // 'small' | 'medium' | 'large'
showSparkline: boolean = true           // attribute: show-sparkline
colorValue: boolean = false             // attribute: color-value
```

## Slots

```typescript
before  // Content before label/value (e.g., icons)
after   // Content after sparkline (e.g., actions)
```

## Usage

```html
<!-- Basic -->
<snice-kpi label="Revenue" value="$45,231"></snice-kpi>

<!-- With icon (before slot) -->
<snice-kpi label="Revenue" value="$45,231">
  <div slot="before">🏆</div>
</snice-kpi>

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
<script>
  document.getElementById('sales').trendData = [20, 25, 22, 30, 28, 35, 32];
</script>

<!-- Sentiments -->
<snice-kpi sentiment="up"></snice-kpi>     <!-- Green, ↑ -->
<snice-kpi sentiment="down"></snice-kpi>   <!-- Red, ↓ -->
<snice-kpi sentiment="neutral"></snice-kpi> <!-- Gray, → -->

<!-- Sizes -->
<snice-kpi size="small"></snice-kpi>
<snice-kpi size="medium"></snice-kpi>
<snice-kpi size="large"></snice-kpi>

<!-- Without sparkline -->
<snice-kpi show-sparkline="false"></snice-kpi>

<!-- Dashboard grid -->
<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
  <snice-kpi
    id="mrr"
    label="MRR"
    value="$127K"
    trend-value="+22%"
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
    id="churn"
    label="Churn"
    value="2.3%"
    trend-value="+0.8%"
    sentiment="down">
  </snice-kpi>
</div>
<script>
  document.getElementById('mrr').trendData = [100, 110, 105, 120, 115, 130, 127];
  document.getElementById('users').trendData = [2000, 2100, 2200, 2250, 2300, 2345];
  document.getElementById('churn').trendData = [1.5, 1.8, 2.0, 2.2, 2.1, 2.3];
</script>
```

## CSS Parts

```css
::part(container)   /* Main container */
::part(header)      /* Header section */
::part(main)        /* Main content (label + value) */
::part(label)       /* Label text */
::part(value)       /* Value text */
::part(trend)       /* Trend container */
::part(trend-icon)  /* Trend icon (↑↓→) */
::part(trend-value) /* Trend value text */
::part(sparkline)   /* Sparkline container */
```

## Notes

- Sparkline automatically uses sentiment color (success/danger/muted)
- Sentiment icons: up=↑, down=↓, neutral=→
- trendData array automatically renders sparkline
- Value can be string or number for formatting flexibility
- showSparkline=false hides sparkline even if data provided

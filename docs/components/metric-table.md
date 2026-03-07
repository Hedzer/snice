<!-- AI: For a low-token version of this doc, use docs/ai/components/metric-table.md instead -->

# Metric Table

`<snice-metric-table>`

A compact data table optimized for numeric and metric data with inline sparklines, color-coded values, and built-in sorting.

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/metric-table/snice-metric-table';
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-metric-table.min.js"></script>
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `columns` | `MetricColumn[]` | `[]` | Column definitions |
| `data` | `Record<string, any>[]` | `[]` | Row data objects |
| `sortBy` (attr: `sort-by`) | `string` | `''` | Column key to sort by |
| `sortDirection` (attr: `sort-direction`) | `'asc' \| 'desc'` | `'desc'` | Sort direction |

### MetricColumn Interface

```typescript
interface MetricColumn {
  key: string;           // Data property key
  label: string;         // Column header label
  type?: 'text' | 'number' | 'percent' | 'currency';  // Format type
  format?: string;       // Currency code (e.g., 'EUR') for currency type
  sparkline?: boolean;   // Render array values as inline sparkline
}
```

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `sort-change` | `{ sortBy: string, sortDirection: 'asc' \| 'desc' }` | Fired when sort column or direction changes |
| `row-click` | `{ row: Record<string, any>, index: number }` | Fired when a row is clicked |

## CSS Parts

| Part | Description |
|------|-------------|
| `base` | Root container |
| `table` | The table element |
| `row` | Individual table row |

```css
snice-metric-table::part(row) {
  height: 3rem;
}

snice-metric-table::part(table) {
  font-size: 0.875rem;
}
```

## Basic Usage

```typescript
import 'snice/components/metric-table/snice-metric-table';
```

```html
<snice-metric-table id="metrics"></snice-metric-table>

<script>
  const el = document.getElementById('metrics');
  el.columns = [
    { key: 'name', label: 'Metric', type: 'text' },
    { key: 'value', label: 'Value', type: 'number' }
  ];
  el.data = [
    { name: 'Page Views', value: 124500 },
    { name: 'Visitors', value: 45200 }
  ];
</script>
```

## Examples

### Column Types

Define column types to control formatting. Numeric types (`number`, `percent`, `currency`) are right-aligned and color-coded.

```html
<script>
  el.columns = [
    { key: 'name', label: 'Metric', type: 'text' },
    { key: 'value', label: 'Value', type: 'number' },
    { key: 'change', label: 'Change', type: 'percent' },
    { key: 'revenue', label: 'Revenue', type: 'currency' }
  ];
</script>
```

### Sparklines

Set `sparkline: true` on a column to render array data as inline SVG sparklines. Sparklines are green when trending up and red when trending down.

```html
<script>
  el.columns = [
    { key: 'name', label: 'Metric', type: 'text' },
    { key: 'trend', label: 'Trend (7d)', sparkline: true }
  ];
  el.data = [
    { name: 'Revenue', trend: [100, 120, 115, 130, 125, 140, 150] },
    { name: 'Churn', trend: [5, 6, 7, 8, 7, 8, 9] }
  ];
</script>
```

### Color-Coded Values

Positive numeric values are displayed in green, negative values in red. This applies automatically to `number`, `percent`, and `currency` column types.

```html
<script>
  el.columns = [
    { key: 'metric', label: 'Metric', type: 'text' },
    { key: 'change', label: 'Change', type: 'percent' }
  ];
  el.data = [
    { metric: 'Revenue', change: 12.3 },    // Green
    { metric: 'Churn', change: -2.5 },       // Red
    { metric: 'Retention', change: 0 }       // Default color
  ];
</script>
```

### Sorting

Click column headers to sort. The first click sorts descending, subsequent clicks toggle direction. The active sort column shows a directional indicator.

```html
<snice-metric-table id="sorted" sort-by="value" sort-direction="desc"></snice-metric-table>

<script>
  document.getElementById('sorted').addEventListener('sort-change', e => {
    console.log('Sort:', e.detail.sortBy, e.detail.sortDirection);
  });
</script>
```

### Currency Formatting

Use the `format` property on currency columns to specify the currency code (default: `USD`).

```html
<script>
  el.columns = [
    { key: 'name', label: 'Product', type: 'text' },
    { key: 'price', label: 'Price (EUR)', type: 'currency', format: 'EUR' }
  ];
</script>
```

### Row Clicks

Listen for `row-click` events to handle row interactions.

```html
<snice-metric-table id="clickable"></snice-metric-table>

<script>
  document.getElementById('clickable').addEventListener('row-click', e => {
    console.log('Row:', e.detail.row, 'Index:', e.detail.index);
  });
</script>
```

## Accessibility

- Column headers have `role="columnheader"` with `aria-sort` attribute
- Rows are keyboard accessible with `tabindex="0"`
- Press Enter or Space to activate a row
- Sort icons provide visual indication of sort state

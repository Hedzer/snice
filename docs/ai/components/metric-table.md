# snice-metric-table

Compact metrics table with sparklines, color-coded values, and built-in sorting.

## Properties

```typescript
columns: MetricColumn[] = [];
data: Record<string, any>[] = [];
sortBy: string = '';           // attr: sort-by
sortDirection: 'asc'|'desc' = 'desc';  // attr: sort-direction
```

## Types

```typescript
interface MetricColumn {
  key: string;
  label: string;
  type?: 'text'|'number'|'percent'|'currency';
  format?: string;       // Currency code for 'currency' type (default: 'USD')
  sparkline?: boolean;   // Render array values as sparkline
}
```

## Events

- `sort-change` -> `{ sortBy: string, sortDirection: 'asc'|'desc' }`
- `row-click` -> `{ row: Record<string, any>, index: number }`

## CSS Parts

- `base` - Root container
- `table` - Table element
- `row` - Table row

## Usage

```html
<snice-metric-table sort-by="value"></snice-metric-table>
```

```typescript
el.columns = [
  { key: 'name', label: 'Metric', type: 'text' },
  { key: 'value', label: 'Value', type: 'number' },
  { key: 'change', label: 'Change', type: 'percent' },
  { key: 'revenue', label: 'Revenue', type: 'currency' },
  { key: 'trend', label: 'Trend', sparkline: true }
];
el.data = [
  { name: 'Page Views', value: 124500, change: 12.3, revenue: 4521.50, trend: [100, 120, 130, 150] },
  { name: 'Bounce Rate', value: 34.2, change: -2.5, revenue: null, trend: [40, 38, 35, 33] }
];
```

## Features

- Column types: text, number, percent, currency
- Inline SVG sparklines from array data
- Positive values green, negative values red
- Click column headers to sort (toggles asc/desc)
- Compact row density
- Currency formatting with locale
- Null/undefined shown as em-dash
- Keyboard accessible rows

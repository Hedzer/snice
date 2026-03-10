<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/stat-group.md -->

# Stat Group

A coordinated row of KPI cards with consistent sizing, trend indicators, and responsive grid layout.

## Table of Contents

- [Properties](#properties)
- [Events](#events)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Accessibility](#accessibility)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `stats` | `StatItem[]` | `[]` | Array of stat objects to display |
| `columns` | `number` | `0` | Number of columns (0 = auto-fit based on width) |
| `variant` | `'card' \| 'minimal' \| 'bordered'` | `'card'` | Visual style variant |

### StatItem

```typescript
interface StatItem {
  label: string;              // Stat label text
  value: string | number;     // Display value
  trend?: 'up' | 'down' | 'neutral';  // Trend direction
  trendValue?: string;        // Trend comparison text (e.g. "+12.5%")
  icon?: string;              // Icon text or emoji
  color?: string;             // Accent color for icon and value
}
```

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `stat-click` | `{ stat: StatItem, index: number }` | A stat card was clicked |

## CSS Parts

| Part | Description |
|------|-------------|
| `base` | The grid container element |
| `stat` | Individual stat card element |

## Basic Usage

```typescript
import 'snice/components/stat-group/snice-stat-group';
```

```html
<snice-stat-group id="stats"></snice-stat-group>

<script>
  document.getElementById('stats').stats = [
    { label: 'Revenue', value: '$45,231', trend: 'up', trendValue: '+12.5%' },
    { label: 'Users', value: '2,338', trend: 'up', trendValue: '+8.2%' },
  ];
</script>
```

## Examples

### Variants

Use `variant` to change the visual style of the stat cards.

```html
<!-- Card (default) - bordered cards with hover effects -->
<snice-stat-group variant="card"></snice-stat-group>

<!-- Minimal - clean, borderless layout -->
<snice-stat-group variant="minimal"></snice-stat-group>

<!-- Bordered - bottom border accent -->
<snice-stat-group variant="bordered"></snice-stat-group>
```

### Fixed Column Count

Use `columns` to set a specific number of columns. Default `0` auto-fits based on width.

```html
<snice-stat-group columns="2"></snice-stat-group>
<snice-stat-group columns="3"></snice-stat-group>
```

### Trend Indicators

Each stat can display a trend direction with comparison text.

```typescript
el.stats = [
  { label: 'Revenue', value: '$45K', trend: 'up', trendValue: '+12.5% vs last month' },
  { label: 'Churn', value: '2.3%', trend: 'down', trendValue: '-0.5%' },
  { label: 'Conversion', value: '3.2%', trend: 'neutral', trendValue: '0.0%' }
];
```

### With Icons and Colors

Customize each stat with an icon and accent color.

```typescript
el.stats = [
  { label: 'Revenue', value: '$45,231', icon: '$', color: 'rgb(22 163 74)', trend: 'up', trendValue: '+12.5%' },
  { label: 'Orders', value: '1,245', icon: '\u{1F4E6}', trend: 'down', trendValue: '-3.1%' }
];
```

### Event Handling

```typescript
el.addEventListener('stat-click', (e) => {
  console.log('Clicked:', e.detail.stat.label, 'at index', e.detail.index);
});
```

## Accessibility

- Each stat card has `role="button"` and is keyboard accessible
- Press Enter or Space to activate a stat card
- Trend indicators use semantic color coding (green for up, red for down)

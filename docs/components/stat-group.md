<!-- AI: For a low-token version of this doc, use docs/ai/components/stat-group.md instead -->

# Stat Group

`<snice-stat-group>`

A coordinated row of KPI cards with consistent sizing, trend indicators, and responsive grid layout.

## Basic Usage

```typescript
import 'snice/components/stat-group/snice-stat-group';
```

```html
<snice-stat-group id="stats"></snice-stat-group>

<script>
  document.getElementById('stats').stats = [
    { label: 'Revenue', value: '$45,231', trend: 'up', trendValue: '+12.5%' },
    { label: 'Users', value: '2,338', trend: 'up', trendValue: '+8.2%' }
  ];
</script>
```

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/stat-group/snice-stat-group';
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-stat-group.min.js"></script>
```

## Examples

### Variants

Use the `variant` attribute to change the visual style of the stat cards.

```html
<!-- Card (default) - bordered cards with hover effects -->
<snice-stat-group variant="card"></snice-stat-group>

<!-- Minimal - clean, borderless layout -->
<snice-stat-group variant="minimal"></snice-stat-group>

<!-- Bordered - bottom border accent -->
<snice-stat-group variant="bordered"></snice-stat-group>
```

### Fixed Column Count

Use the `columns` attribute to set a specific number of columns. When set to `0` (default), columns auto-fit based on available width.

```html
<snice-stat-group columns="2"></snice-stat-group>
<snice-stat-group columns="3"></snice-stat-group>
```

### Trend Indicators

Each stat can display a trend direction and value showing comparison data.

```html
<script>
  el.stats = [
    { label: 'Revenue', value: '$45K', trend: 'up', trendValue: '+12.5% vs last month' },
    { label: 'Churn', value: '2.3%', trend: 'down', trendValue: '-0.5%' },
    { label: 'Conversion', value: '3.2%', trend: 'neutral', trendValue: '0.0%' }
  ];
</script>
```

### With Icons and Colors

Customize each stat with an icon and accent color.

```html
<script>
  el.stats = [
    { label: 'Revenue', value: '$45,231', icon: '$', color: 'rgb(22 163 74)', trend: 'up', trendValue: '+12.5%' },
    { label: 'Orders', value: '1,245', icon: '\u{1F4E6}', trend: 'down', trendValue: '-3.1%' }
  ];
</script>
```

### Handling Clicks

Listen for the `stat-click` event to respond when a user clicks a stat card.

```html
<snice-stat-group id="clickable-stats"></snice-stat-group>

<script>
  document.getElementById('clickable-stats').addEventListener('stat-click', e => {
    console.log('Clicked stat:', e.detail.stat.label);
    console.log('Index:', e.detail.index);
  });
</script>
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `stats` | `StatItem[]` | `[]` | Array of stat objects to display |
| `columns` | `number` | `0` | Number of columns (0 = auto-fit) |
| `variant` | `'card' \| 'minimal' \| 'bordered'` | `'card'` | Visual style variant |

### StatItem Interface

```typescript
interface StatItem {
  label: string;              // Stat label text
  value: string | number;     // Display value
  trend?: 'up' | 'down' | 'neutral';  // Trend direction
  trendValue?: string;        // Trend comparison text
  icon?: string;              // Icon text or emoji
  color?: string;             // Accent color for icon and value
}
```

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `stat-click` | `{ stat: StatItem, index: number }` | Fired when a stat card is clicked |

## CSS Parts

| Part | Description |
|------|-------------|
| `base` | The grid container element |
| `stat` | Individual stat card element |

```css
snice-stat-group::part(stat) {
  border-radius: 1rem;
}

snice-stat-group::part(base) {
  gap: 2rem;
}
```

## Accessibility

- Each stat card has `role="button"` and is keyboard accessible
- Press Enter or Space to activate a stat card
- Trend indicators use semantic color coding (green for up, red for down)

## Best Practices

1. Keep stat labels short and descriptive
2. Use consistent value formatting across stats
3. Include trend data when comparing periods
4. Use the `card` variant for dashboard layouts
5. Use `minimal` variant when embedding in existing card containers
6. Set `columns` when you need precise layout control

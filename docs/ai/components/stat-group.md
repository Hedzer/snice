# snice-stat-group

Coordinated row of KPI cards with trend indicators and responsive grid layout.

## Properties

```typescript
stats: StatItem[] = [];
columns: number = 0;  // 0 = auto-fit
variant: 'card'|'minimal'|'bordered' = 'card';
```

## Types

```typescript
interface StatItem {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon?: string;
  color?: string;
}
```

## Events

- `stat-click` -> `{ stat: StatItem, index: number }`

## CSS Parts

- `base` - Grid container
- `stat` - Individual stat card

## Usage

```html
<snice-stat-group></snice-stat-group>
```

```typescript
el.stats = [
  { label: 'Revenue', value: '$45,231', trend: 'up', trendValue: '+12.5%' },
  { label: 'Users', value: '2,338', trend: 'up', trendValue: '+8.2%' },
  { label: 'Orders', value: '1,245', trend: 'down', trendValue: '-3.1%' },
  { label: 'Bounce', value: '3.24%', trend: 'neutral', trendValue: '0.0%' }
];
```

```html
<!-- Variants -->
<snice-stat-group variant="minimal"></snice-stat-group>
<snice-stat-group variant="bordered"></snice-stat-group>

<!-- Fixed columns -->
<snice-stat-group columns="2"></snice-stat-group>
```

```typescript
// With icons and colors
el.stats = [
  { label: 'Revenue', value: '$45K', icon: '$', color: 'rgb(22 163 74)', trend: 'up', trendValue: '+12%' }
];
```

## Features

- 3 visual variants: card, minimal, bordered
- Auto-fit responsive grid (wraps on narrow viewports)
- Fixed column count option
- Trend indicators (up/down/neutral) with color coding
- Icon and color customization per stat
- Keyboard accessible (Enter/Space to click)

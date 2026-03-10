# snice-stat-group

Coordinated row of KPI cards with trend indicators and responsive grid layout.

## Properties

```typescript
stats: StatItem[] = [];
columns: number = 0;             // 0 = auto-fit
variant: 'card'|'minimal'|'bordered' = 'card';

interface StatItem {
  label: string;
  value: string | number;
  trend?: 'up'|'down'|'neutral';
  trendValue?: string;
  icon?: string;
  color?: string;
}
```

## Events

- `stat-click` → `{ stat, index }`

## CSS Parts

- `base` - Grid container
- `stat` - Individual stat card

## Basic Usage

```html
<snice-stat-group></snice-stat-group>
```

```typescript
el.stats = [
  { label: 'Revenue', value: '$45,231', trend: 'up', trendValue: '+12.5%' },
  { label: 'Users', value: '2,338', trend: 'up', trendValue: '+8.2%' },
  { label: 'Orders', value: '1,245', trend: 'down', trendValue: '-3.1%' },
];
```

```html
<snice-stat-group variant="minimal"></snice-stat-group>
<snice-stat-group variant="bordered"></snice-stat-group>
<snice-stat-group columns="2"></snice-stat-group>
```

```typescript
// With icons and colors
el.stats = [
  { label: 'Revenue', value: '$45K', icon: '$', color: 'rgb(22 163 74)', trend: 'up', trendValue: '+12%' }
];

el.addEventListener('stat-click', (e) => console.log(e.detail.stat.label));
```

## Accessibility

- Stat cards have `role="button"`, keyboard accessible (Enter/Space)
- Trend indicators use semantic color coding

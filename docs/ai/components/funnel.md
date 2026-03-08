# snice-funnel

SVG-based funnel chart for conversion tracking and pipeline visualization.

## Properties

```typescript
data: FunnelStage[] = [];           // Array of { label, value, color? }
variant: 'default'|'gradient' = 'default';
orientation: 'vertical'|'horizontal' = 'vertical';
showLabels: boolean = true;          // attribute: show-labels
showValues: boolean = true;          // attribute: show-values
showPercentages: boolean = true;     // attribute: show-percentages
animation: boolean = false;
```

## Types

```typescript
interface FunnelStage {
  label: string;
  value: number;
  color?: string;
}
```

## Methods

- `setStages(stages: FunnelStage[])` — replace all stages
- `exportImage(format?: 'png'|'svg')` — returns data URL string

## Events

- `funnel-click` → `{ stage: FunnelStage; index: number }` — stage clicked
- `funnel-hover` → `{ stage: FunnelStage; index: number }` — stage hovered

## Usage

```html
<!-- Basic -->
<snice-funnel></snice-funnel>
```

```typescript
funnel.data = [
  { label: 'Visitors', value: 10000 },
  { label: 'Leads', value: 5000 },
  { label: 'Customers', value: 500 },
];
```

```html

<!-- Gradient variant -->
<snice-funnel variant="gradient"></snice-funnel>

<!-- Horizontal -->
<snice-funnel orientation="horizontal"></snice-funnel>

<!-- Custom colors -->
data = [
  { label: 'A', value: 100, color: 'rgb(37 99 235)' },
  { label: 'B', value: 50, color: 'rgb(22 163 74)' },
]

<!-- Hide elements -->
<snice-funnel show-labels="false" show-values="false"></snice-funnel>

<!-- With animation -->
<snice-funnel animation></snice-funnel>
```

**CSS Parts:**
- `base` - Outer funnel container div
- `chart` - SVG chart rendering area
- `tooltip` - Hover tooltip element

## Features

- SVG trapezoid shapes per stage
- Vertical (default) and horizontal orientation
- 2 variants: default (distinct colors), gradient (opacity fade)
- Custom color per stage, falls back to theme palette
- Labels, values (auto-formatted K/M), percentages
- Tooltip on hover
- Click + hover events
- Keyboard accessible (Enter/Space)
- ARIA: role="img" on SVG, role="button" + aria-label on stages
- CSS animation on initial render
- Responsive via SVG viewBox
- Works without theme (CSS fallbacks)

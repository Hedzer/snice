# snice-funnel

SVG-based funnel chart for conversion tracking and pipeline visualization.

## Properties

```typescript
data: FunnelStage[] = [];                    // attribute: false (set via JS)
variant: 'default'|'gradient' = 'default';
orientation: 'vertical'|'horizontal' = 'vertical';
showLabels: boolean = true;                  // attribute: show-labels
showValues: boolean = true;                  // attribute: show-values
showPercentages: boolean = true;             // attribute: show-percentages
animation: boolean = false;
```

```typescript
interface FunnelStage { label: string; value: number; color?: string; }
```

## Methods

- `setStages(stages: FunnelStage[])` - Replace all stages
- `exportImage(format?: 'png'|'svg'): string` - Returns data URL

## Events

- `funnel-click` → `{ stage: FunnelStage, index: number }`
- `funnel-hover` → `{ stage: FunnelStage, index: number }`

## CSS Parts

- `base` - Root funnel container
- `chart` - Chart area holding the SVG
- `svg` - The funnel SVG
- `stage` - A stage group
- `stage-shape` - The filled shape of a stage
- `label` - Stage label text
- `value` - Stage value text
- `percentage` - Stage conversion percentage text
- `tooltip` - Hover tooltip
- `tooltip-label` - Tooltip label line
- `tooltip-value` - Tooltip value line

## Basic Usage

```typescript
import 'snice/components/funnel/snice-funnel';
```

```html
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
<snice-funnel variant="gradient"></snice-funnel>
<snice-funnel orientation="horizontal"></snice-funnel>
<snice-funnel show-labels="false" show-values="false"></snice-funnel>
<snice-funnel animation></snice-funnel>
```

```typescript
funnel.addEventListener('funnel-click', e => console.log(e.detail.stage));
const svgUrl = funnel.exportImage('svg');
```

## Keyboard Navigation

- Enter/Space - Activate focused stage
- Tab - Navigate between stages

## Accessibility

- SVG: `role="img"` with `aria-label="Funnel chart"`
- Stages: `role="button"`, `tabindex="0"`, descriptive `aria-label`

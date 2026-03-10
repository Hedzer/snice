# snice-gauge

SVG-based semicircle gauge/meter for dashboards and data visualization.

## Properties

```typescript
value: number = 0;
min: number = 0;
max: number = 100;
label: string = '';
variant: 'default'|'primary'|'success'|'warning'|'error'|'info' = 'default';
size: 'small'|'medium'|'large' = 'medium';
showValue: boolean = true;
thickness: number = 8;
```

## CSS Parts

- `base` - Outer gauge container div with role="meter"
- `value` - Numeric value text span
- `label` - Label text span below the gauge

## Basic Usage

```typescript
import 'snice/components/gauge/snice-gauge';
```

```html
<!-- Basic -->
<snice-gauge value="75"></snice-gauge>

<!-- With label -->
<snice-gauge value="42" label="CPU Usage"></snice-gauge>

<!-- Custom range -->
<snice-gauge value="180" min="0" max="300" label="Temperature"></snice-gauge>

<!-- Variants -->
<snice-gauge value="90" variant="error" label="Critical"></snice-gauge>
<snice-gauge value="50" variant="warning" label="Moderate"></snice-gauge>
<snice-gauge value="25" variant="success" label="Good"></snice-gauge>

<!-- Sizes -->
<snice-gauge value="60" size="small"></snice-gauge>
<snice-gauge value="60" size="medium"></snice-gauge>
<snice-gauge value="60" size="large"></snice-gauge>

<!-- Custom thickness -->
<snice-gauge value="65" thickness="12"></snice-gauge>

<!-- Hide value text -->
<snice-gauge value="50" showValue="false"></snice-gauge>
```

## Accessibility

- role="meter" with aria-valuenow/min/max
- aria-label from `label` prop or fallback "Gauge: {value}"
- Smooth CSS transitions respect prefers-reduced-motion

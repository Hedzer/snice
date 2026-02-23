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
showValue: boolean = true;     // attribute: show-value
thickness: number = 8;
```

## Usage

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

## Features

- SVG semicircle arc with animated fill
- 6 color variants
- 3 sizes (small 80px, medium 120px, large 160px)
- Custom min/max range
- Configurable stroke thickness
- Optional value display and label
- Accessible: role="meter" with aria-valuenow/min/max
- Smooth CSS transitions
- Works without theme (CSS fallbacks)

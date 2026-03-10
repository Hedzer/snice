# snice-progress-ring

Determinate circular progress indicator with animated SVG ring fill and optional center text.

## Properties

```typescript
value: number = 0;                                   // 0 to max
max: number = 100;
size: 'small'|'medium'|'large' = 'medium';
thickness: number = 4;                               // Ring stroke width
color: string = '';                                  // Custom ring color (CSS value)
showValue: boolean = false;                          // attr: show-value, show percentage in center
label: string = '';                                  // Custom center text
```

## Events

- `progress-complete` → `{ value, max, component }` - Value reached max

## CSS Parts

- `base` - Outer container with role="progressbar"
- `track` - Background circle
- `fill` - Progress circle
- `center` - Center text container
- `value` - Percentage text
- `label` - Label text

## Basic Usage

```html
<snice-progress-ring value="75" show-value></snice-progress-ring>
<snice-progress-ring value="60" label="CPU"></snice-progress-ring>
<snice-progress-ring value="80" color="#10b981" show-value></snice-progress-ring>
<snice-progress-ring value="50" size="large" thickness="6" show-value></snice-progress-ring>
```

```typescript
import 'snice/components/progress-ring/snice-progress-ring';

ring.addEventListener('progress-complete', () => {
  console.log('Complete!');
});
```

## Accessibility

- Uses `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- Label or percentage used as `aria-label`

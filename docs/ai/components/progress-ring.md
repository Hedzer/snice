# snice-progress-ring

Determinate circular progress indicator with animated SVG ring fill and optional center text.

## Properties

```typescript
value: number = 0;                 // 0 to max
max: number = 100;
size: 'small'|'medium'|'large' = 'medium';
thickness: number = 4;             // ring stroke width
color: string = '';                // custom ring color (CSS value)
showValue: boolean = false;        // attr: show-value, show percentage in center
label: string = '';                // custom center text
```

## Events

- `progress-complete` -> `{ value: number, max: number, component: SniceProgressRingElement }`

## CSS Parts

- `base` - Outer container with role="progressbar"
- `track` - Background circle
- `fill` - Progress circle
- `center` - Center text container
- `value` - Percentage text
- `label` - Label text

## Usage

```html
<!-- Basic -->
<snice-progress-ring value="75"></snice-progress-ring>

<!-- With percentage display -->
<snice-progress-ring value="42" show-value></snice-progress-ring>

<!-- With label -->
<snice-progress-ring value="60" label="CPU"></snice-progress-ring>

<!-- Custom color -->
<snice-progress-ring value="80" color="#10b981" show-value></snice-progress-ring>

<!-- Sizes -->
<snice-progress-ring value="50" size="small"></snice-progress-ring>
<snice-progress-ring value="50" size="large" show-value></snice-progress-ring>

<!-- Custom thickness -->
<snice-progress-ring value="65" thickness="6" show-value></snice-progress-ring>

<!-- Custom max -->
<snice-progress-ring value="150" max="200" show-value></snice-progress-ring>
```

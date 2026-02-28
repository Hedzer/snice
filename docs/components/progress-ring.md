[//]: # (AI: For a low-token version of this doc, use docs/ai/components/progress-ring.md instead)

# Progress Ring
`<snice-progress-ring>`

A determinate circular progress indicator that displays progress as an animated SVG ring fill with optional center text.

## Basic Usage

```typescript
import 'snice/components/progress-ring/snice-progress-ring';
```

```html
<snice-progress-ring value="75" show-value></snice-progress-ring>
```

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/progress-ring/snice-progress-ring';
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-progress-ring.min.js"></script>
```

## Examples

### Showing the Percentage

Set the `show-value` attribute to display the percentage in the center of the ring.

```html
<snice-progress-ring value="42" show-value></snice-progress-ring>
```

### Custom Label

Use the `label` attribute to display custom text in the center instead of (or alongside) the percentage.

```html
<snice-progress-ring value="60" label="CPU" show-value></snice-progress-ring>
```

### Sizes

Use the `size` attribute to change the ring's size.

```html
<snice-progress-ring value="50" size="small" show-value></snice-progress-ring>
<snice-progress-ring value="50" size="medium" show-value></snice-progress-ring>
<snice-progress-ring value="50" size="large" show-value></snice-progress-ring>
```

### Custom Color

Use the `color` attribute to set a custom ring color.

```html
<snice-progress-ring value="80" color="#10b981" show-value></snice-progress-ring>
<snice-progress-ring value="30" color="rgb(239, 68, 68)" show-value></snice-progress-ring>
```

### Custom Thickness

Use the `thickness` attribute to adjust the stroke width of the ring.

```html
<snice-progress-ring value="65" thickness="2" show-value></snice-progress-ring>
<snice-progress-ring value="65" thickness="8" show-value></snice-progress-ring>
```

### Custom Max Value

Use the `max` attribute to set a maximum value other than 100.

```html
<snice-progress-ring value="150" max="200" show-value></snice-progress-ring>
```

### Completion Event

Listen to the `progress-complete` event to react when progress reaches the maximum.

```html
<snice-progress-ring id="upload" value="0" max="100" show-value></snice-progress-ring>

<script>
  const ring = document.getElementById('upload');
  ring.addEventListener('progress-complete', () => {
    console.log('Upload complete!');
  });
</script>
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `value` | `number` | `0` | Current progress value (0 to max) |
| `max` | `number` | `100` | Maximum value |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Ring size |
| `thickness` | `number` | `4` | Ring stroke width |
| `color` | `string` | `''` | Custom ring color (any CSS color value) |
| `showValue` (attr: `show-value`) | `boolean` | `false` | Show percentage in center |
| `label` | `string` | `''` | Custom center text |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `progress-complete` | `{ value: number, max: number, component: SniceProgressRingElement }` | Fired when value reaches max |

## CSS Parts

| Part | Description |
|------|-------------|
| `base` | Outer container with `role="progressbar"` |
| `track` | Background circle |
| `fill` | Progress circle |
| `center` | Center text container |
| `value` | Percentage text |
| `label` | Label text |

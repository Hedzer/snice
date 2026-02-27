[//]: # (AI: For a low-token version of this doc, use docs/ai/components/progress.md instead)

# Progress
`<snice-progress>`

A progress indicator with linear and circular display variants.

## Basic Usage

```typescript
import 'snice/components/progress/snice-progress';
```

```html
<snice-progress value="50"></snice-progress>
```

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/progress/snice-progress';
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-progress.min.js"></script>
```

## Examples

### Variants

Use the `variant` attribute to switch between linear and circular display.

```html
<snice-progress value="60" variant="linear"></snice-progress>
<snice-progress value="60" variant="circular"></snice-progress>
```

### Sizes

Use the `size` attribute to change the progress indicator size.

```html
<snice-progress value="50" size="small"></snice-progress>
<snice-progress value="50" size="medium"></snice-progress>
<snice-progress value="50" size="large"></snice-progress>
<snice-progress value="50" size="xl" variant="circular"></snice-progress>
<snice-progress value="50" size="xxl" variant="circular"></snice-progress>
<snice-progress value="50" size="xxxl" variant="circular"></snice-progress>
```

### Colors

Use the `color` attribute with semantic names or any CSS color value.

```html
<snice-progress value="80" color="primary"></snice-progress>
<snice-progress value="80" color="success"></snice-progress>
<snice-progress value="80" color="warning"></snice-progress>
<snice-progress value="80" color="error"></snice-progress>
<snice-progress value="80" color="info"></snice-progress>
<snice-progress value="80" color="#3b82f6"></snice-progress>
```

### Indeterminate

Set the `indeterminate` attribute for unknown progress (loading state).

```html
<snice-progress indeterminate></snice-progress>
<snice-progress variant="circular" indeterminate></snice-progress>
```

### With Label

Use the `show-label` attribute to display the percentage, or `label` for custom text.

```html
<snice-progress value="60" show-label></snice-progress>
<snice-progress value="60" label="Uploading..."></snice-progress>
```

### Striped and Animated

Use `striped` for a striped pattern and `animated` for animated stripes.

```html
<snice-progress value="70" striped></snice-progress>
<snice-progress value="70" striped animated></snice-progress>
```

### Custom Max

Use the `max` attribute to set a custom maximum value.

```html
<snice-progress value="3" max="10"></snice-progress>
```

### Circular Thickness

Use the `thickness` attribute to control the circular variant's stroke width.

```html
<snice-progress variant="circular" value="75" thickness="8" size="xl"></snice-progress>
```

### Dynamic Updates

```html
<snice-progress id="upload" value="0"></snice-progress>

<script type="module">
  import 'snice/components/progress/snice-progress';

  const progress = document.getElementById('upload');
  let value = 0;

  setInterval(() => {
    value = (value + 10) % 100;
    progress.value = value;
  }, 500);
</script>
```

### Programmatic Control

```typescript
const progress = document.querySelector('snice-progress');

// Set progress
progress.setProgress(75);
progress.setProgress(3, 10); // value 3, max 10

// Get percentage
console.log(progress.getPercentage()); // 75
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `value` | `number` | `0` | Current progress value |
| `max` | `number` | `100` | Maximum value |
| `variant` | `'linear' \| 'circular'` | `'linear'` | Display variant |
| `size` | `'small' \| 'medium' \| 'large' \| 'xl' \| 'xxl' \| 'xxxl'` | `'medium'` | Size of the indicator |
| `color` | `'primary' \| 'success' \| 'warning' \| 'error' \| 'info'` or CSS color | `'primary'` | Bar color |
| `indeterminate` | `boolean` | `false` | Unknown progress mode |
| `showLabel` (attr: `show-label`) | `boolean` | `false` | Show percentage label |
| `label` | `string` | `''` | Custom label text (overrides percentage) |
| `striped` | `boolean` | `false` | Striped bar pattern |
| `animated` | `boolean` | `false` | Animate striped pattern |
| `thickness` | `number` | `4` | Stroke width for circular variant |

## CSS Parts

Style internal elements from outside the shadow DOM using `::part()`.

### Linear variant

| Part | Element | Description |
|------|---------|-------------|
| `base` | `<div>` | Outer progress container |
| `bar` | `<div>` | The progress bar fill |
| `label` | `<span>` | Percentage or custom label text |

### Circular variant

| Part | Element | Description |
|------|---------|-------------|
| `base` | `<div>` | Outer progress container |
| `circle` | `<svg>` | The SVG element |
| `circle-bg` | `<circle>` | Background circle stroke |
| `circle-bar` | `<circle>` | Foreground progress arc |
| `label` | `<div>` | Percentage or custom label text |

```css
snice-progress::part(bar) {
  border-radius: 0;
}

snice-progress::part(label) {
  font-weight: 700;
}

snice-progress::part(circle-bar) {
  filter: drop-shadow(0 0 4px currentColor);
}
```

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `progress-change` | `{ value: number, max: number, percentage: number, indeterminate: boolean }` | Fired when value, max, or indeterminate changes |

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `setProgress()` | `value: number, max?: number` | Set progress value and optionally max |
| `getPercentage()` | -- | Returns the calculated percentage (0-100) |

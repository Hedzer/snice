<!-- AI: For a low-token version of this doc, use docs/ai/components/skeleton.md instead -->

# Skeleton
`<snice-skeleton>`

Displays placeholder loading animations to indicate content is being loaded.

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/skeleton/snice-skeleton';
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-skeleton.min.js"></script>
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `variant` | `'text' \| 'circular' \| 'rectangular' \| 'rounded'` | `'text'` | Shape of the skeleton |
| `width` | `string` | `''` | Custom width (CSS value) |
| `height` | `string` | `''` | Custom height (CSS value) |
| `animation` | `'pulse' \| 'wave' \| 'none'` | `'wave'` | Animation style |
| `count` | `number` | `1` | Number of skeleton lines to render |
| `spacing` | `string` | `'8px'` | Gap between multiple skeleton lines |

## CSS Custom Properties

| Property | Description | Default |
|----------|-------------|---------|
| `--skeleton-bg` | Background color | `var(--snice-color-background-tertiary)` |
| `--skeleton-highlight` | Wave highlight color | `var(--snice-color-background-secondary)` |
| `--skeleton-duration` | Animation duration | `1.5s` |

## CSS Parts

Style internal elements from outside the shadow DOM using `::part()`.

| Part | Element | Description |
|------|---------|-------------|
| `base` | `<div>` | Outer skeleton container |
| `bone` | `<div>` | Individual skeleton placeholder element |

```css
snice-skeleton::part(bone) {
  border-radius: 0.5rem;
}

snice-skeleton::part(base) {
  padding: 0.5rem;
}
```

## Basic Usage

```typescript
import 'snice/components/skeleton/snice-skeleton';
```

```html
<snice-skeleton></snice-skeleton>
```

## Examples

### Variants

Use the `variant` attribute to change the skeleton shape.

```html
<snice-skeleton variant="text"></snice-skeleton>
<snice-skeleton variant="circular"></snice-skeleton>
<snice-skeleton variant="rectangular"></snice-skeleton>
<snice-skeleton variant="rounded"></snice-skeleton>
```

### Paragraph

Set the `count` attribute to render multiple skeleton lines, simulating a paragraph.

```html
<snice-skeleton variant="text" count="4"></snice-skeleton>
```

### Custom Dimensions

Use the `width` and `height` attributes to set custom sizes.

```html
<snice-skeleton variant="rectangular" width="200px" height="150px"></snice-skeleton>
<snice-skeleton variant="circular" width="64px" height="64px"></snice-skeleton>
```

### Animation Styles

Use the `animation` attribute to change the loading animation.

```html
<snice-skeleton animation="wave"></snice-skeleton>
<snice-skeleton animation="pulse"></snice-skeleton>
<snice-skeleton animation="none"></snice-skeleton>
```

### Spacing

Use the `spacing` attribute to control the gap between multiple skeleton lines.

```html
<snice-skeleton variant="text" count="3" spacing="12px"></snice-skeleton>
```

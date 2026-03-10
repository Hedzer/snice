<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/skeleton.md -->

# Skeleton

Displays placeholder loading animations to indicate content is being loaded.

## Table of Contents

- [Properties](#properties)
- [CSS Custom Properties](#css-custom-properties)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Accessibility](#accessibility)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `variant` | `'text' \| 'circular' \| 'rectangular' \| 'rounded'` | `'text'` | Shape of the skeleton |
| `width` | `string` | `''` | Custom width (CSS value) |
| `height` | `string` | `''` | Custom height (CSS value) |
| `animation` | `'pulse' \| 'wave' \| 'none'` | `'wave'` | Animation style |
| `count` | `number` | `1` | Number of skeleton lines to render |
| `spacing` | `string` | `'8px'` | Gap between multiple lines |

## CSS Custom Properties

| Property | Description | Default |
|----------|-------------|---------|
| `--skeleton-bg` | Background color | `var(--snice-color-background-tertiary)` |
| `--skeleton-highlight` | Wave highlight color | `var(--snice-color-background-secondary)` |
| `--skeleton-duration` | Animation duration | `1.5s` |

## CSS Parts

| Part | Description |
|------|-------------|
| `base` | Outer skeleton container |
| `bone` | Individual skeleton placeholder element |

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
<snice-skeleton variant="circular" width="64px" height="64px"></snice-skeleton>
<snice-skeleton variant="rectangular" width="200px" height="150px"></snice-skeleton>
<snice-skeleton variant="rounded" width="300px" height="150px"></snice-skeleton>
```

### Paragraph

Set `count` to render multiple skeleton lines simulating a paragraph.

```html
<snice-skeleton variant="text" count="4"></snice-skeleton>
```

### Animation Styles

Use `animation` to change the loading animation.

```html
<snice-skeleton animation="wave"></snice-skeleton>
<snice-skeleton animation="pulse"></snice-skeleton>
<snice-skeleton animation="none"></snice-skeleton>
```

### Complex Layout

Combine variants to create loading placeholders for cards or profiles.

```html
<div style="display: flex; gap: 16px;">
  <snice-skeleton variant="circular" width="48px" height="48px"></snice-skeleton>
  <div style="flex: 1;">
    <snice-skeleton variant="text" width="40%"></snice-skeleton>
    <snice-skeleton variant="text" width="60%"></snice-skeleton>
  </div>
</div>
```

## Accessibility

- Purely decorative placeholder; does not convey content to screen readers
- Use `aria-busy="true"` on the container element while loading
- Replace with actual content once loaded

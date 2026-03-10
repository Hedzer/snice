<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/rating.md -->

# Rating

An interactive star rating input with configurable precision, custom icons, and keyboard navigation.

## Table of Contents

- [Properties](#properties)
- [Events](#events)
- [CSS Custom Properties](#css-custom-properties)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Keyboard Navigation](#keyboard-navigation)
- [Accessibility](#accessibility)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `value` | `number` | `0` | Current rating value |
| `max` | `number` | `5` | Maximum number of stars |
| `icon` | `string` | `'★'` | Character used for each rating item |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Display size |
| `readonly` | `boolean` | `false` | Disable user interaction |
| `precision` | `'full' \| 'half'` | `'full'` | Click precision (full or half star increments) |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `rating-change` | `{ value: number }` | Fired when the rating value changes |

## CSS Custom Properties

| Property | Description | Default |
|----------|-------------|---------|
| `--rating-color` | Filled star color | `var(--snice-color-warning, rgb(234 179 8))` |
| `--rating-color-empty` | Empty star color | `var(--snice-color-border, rgb(226 226 226))` |
| `--rating-size` | Star size (set automatically by `size` property) | `1.5rem` |

## CSS Parts

| Part | Description |
|------|-------------|
| `base` | The outer rating container |
| `star` | Individual star/icon element |

## Basic Usage

```typescript
import 'snice/components/rating/snice-rating';
```

```html
<snice-rating value="3" max="5"></snice-rating>
```

## Examples

### Half-Star Precision

Use `precision="half"` to allow half-star selections.

```html
<snice-rating value="3.5" precision="half"></snice-rating>
```

### Sizes

Use the `size` attribute to adjust the display size.

```html
<snice-rating value="4" size="small"></snice-rating>
<snice-rating value="4" size="medium"></snice-rating>
<snice-rating value="4" size="large"></snice-rating>
```

### Custom Icons

Use the `icon` attribute to replace the default star with any character or emoji.

```html
<snice-rating value="3" icon="❤" max="5"></snice-rating>
<snice-rating value="7" icon="👍" max="10"></snice-rating>
```

### Readonly Display

Use `readonly` to display a rating without allowing interaction.

```html
<snice-rating value="4.5" precision="half" readonly></snice-rating>
```

### Custom Colors

Override CSS custom properties to customize the colors.

```html
<style>
  .custom-rating {
    --rating-color: #e91e63;
    --rating-color-empty: #f8bbd0;
  }
</style>
<snice-rating class="custom-rating" value="3" icon="❤" max="5"></snice-rating>
```

### Event Handling

Listen to `rating-change` to respond to user input.

```typescript
rating.addEventListener('rating-change', (e) => {
  console.log('You rated:', e.detail.value);
});
```

## Keyboard Navigation

| Key | Action |
|-----|--------|
| `ArrowRight` / `ArrowUp` | Increase rating by one step |
| `ArrowLeft` / `ArrowDown` | Decrease rating by one step |

Step size is 1 for `'full'` precision and 0.5 for `'half'` precision.

## Accessibility

- Uses `role="radiogroup"` for the container with `role="radio"` per star
- Arrow keys navigate the rating value
- Focus ring shown on keyboard navigation
- When `readonly` is set, the component is not focusable
- Each star announces its position (e.g., "3 of 5")

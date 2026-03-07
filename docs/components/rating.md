<!-- AI: For a low-token version of this doc, use docs/ai/components/rating.md instead -->

# Rating Component

The rating component provides an interactive star rating input with configurable precision (full or half stars), custom icons, multiple sizes, and full keyboard navigation.

## Table of Contents
- [Basic Usage](#basic-usage)
- [Properties](#properties)
- [Events](#events)
- [CSS Custom Properties](#css-custom-properties)
- [Examples](#examples)
- [Accessibility](#accessibility)

## Basic Usage

```html
<snice-rating value="3" max="5"></snice-rating>
```

```typescript
import 'snice/components/rating/snice-rating';
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `value` | `number` | `0` | Current rating value |
| `max` | `number` | `5` | Maximum number of stars |
| `icon` | `string` | `'\u2605'` (filled star) | Character used for each rating item |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Display size |
| `readonly` | `boolean` | `false` | Disable user interaction |
| `precision` | `'full' \| 'half'` | `'full'` | Click precision (full star or half star increments) |

## Events

#### `rating-change`
Fired when the rating value changes.

**Event Detail:**
```typescript
{
  value: number;  // The new rating value
}
```

## CSS Custom Properties

| Property | Description | Default |
|----------|-------------|---------|
| `--rating-color` | Filled star color | `var(--snice-color-warning)` |
| `--rating-color-empty` | Empty star color | `var(--snice-color-border)` |
| `--rating-size` | Star size (set automatically by `size` property) | `1.5rem` (medium) |

## CSS Parts

Style internal elements from outside the shadow DOM using `::part()`.

| Part | Element | Description |
|------|---------|-------------|
| `base` | `<div>` | Outer rating container |
| `star` | `<span>` | Individual star/icon element |

```css
snice-rating::part(star) {
  transition: transform 0.2s ease;
}

snice-rating::part(star):hover {
  transform: scale(1.2);
}

snice-rating::part(base) {
  gap: 0.25rem;
}
```

## Examples

### Basic Rating

```html
<snice-rating value="3"></snice-rating>
<snice-rating value="4" max="5"></snice-rating>
<snice-rating value="0"></snice-rating>
```

### Half-Star Precision

Use the `precision="half"` attribute to allow half-star selections.

```html
<snice-rating value="3.5" precision="half"></snice-rating>
<snice-rating value="2.5" precision="half" max="5"></snice-rating>
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
<!-- Heart rating -->
<snice-rating value="3" icon="&#x2764;" max="5"></snice-rating>

<!-- Thumbs up rating -->
<snice-rating value="7" icon="&#x1F44D;" max="10"></snice-rating>

<!-- Circle rating -->
<snice-rating value="2" icon="&#x25CF;" max="4"></snice-rating>
```

### Readonly Display

Use the `readonly` attribute to display a rating without allowing interaction.

```html
<snice-rating value="4.5" precision="half" readonly></snice-rating>
<snice-rating value="3" readonly></snice-rating>
```

### Handling Rating Changes

```html
<snice-rating id="product-rating" value="0" max="5"></snice-rating>
<p id="rating-label">No rating selected</p>

<script type="module">
  import 'snice/components/rating/snice-rating';

  const rating = document.getElementById('product-rating');
  const label = document.getElementById('rating-label');

  rating.addEventListener('rating-change', (e) => {
    label.textContent = `You rated: ${e.detail.value} out of 5`;
  });
</script>
```

### Custom Styled Rating

```html
<style>
  .custom-rating {
    --rating-color: #e91e63;
    --rating-color-empty: #f8bbd0;
  }
</style>

<snice-rating class="custom-rating" value="3" icon="&#x2764;" max="5"></snice-rating>
```

## Accessibility

- **ARIA role**: Uses `role="radiogroup"` for the container with individual `role="radio"` per star
- **Keyboard support**: Arrow keys (Left/Down to decrease, Right/Up to increase) navigate the rating; step size matches precision (1 for full, 0.5 for half)
- **Focus indicators**: Clear focus ring on the active star
- **Readonly mode**: When `readonly` is set, the component is not focusable or interactive
- **Screen readers**: Current value and maximum are announced

## Best Practices

1. **Use half precision for review systems**: Half-star ratings give users more granularity
2. **Display readonly ratings for averages**: Show aggregate scores as readonly
3. **Keep max reasonable**: 5 or 10 stars are conventional; more becomes unwieldy
4. **Provide context**: Pair ratings with labels explaining what is being rated
5. **Use custom icons sparingly**: Stars are universally understood; custom icons may need additional context

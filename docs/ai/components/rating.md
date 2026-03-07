# snice-rating

Star rating input with full/half precision, custom icons, and keyboard navigation.

## Properties

```ts
value: number                            // Current rating value (default: 0)
max: number                              // Maximum stars (default: 5)
icon: string                             // Star character (default: '\u2605')
size: 'small' | 'medium' | 'large'      // Display size (default: 'medium')
readonly: boolean                        // Disable interaction (default: false)
precision: 'full' | 'half'              // Click precision (default: 'full')
```

## Events

- `rating-change` → `{ value: number }` - Rating value changed

## Keyboard

- `ArrowRight` / `ArrowUp` - Increase value
- `ArrowLeft` / `ArrowDown` - Decrease value
- Step size: 1 (full) or 0.5 (half precision)

## CSS Custom Properties

```css
--rating-color             /* Filled star color (default: --snice-color-warning) */
--rating-color-empty       /* Empty star color (default: --snice-color-border) */
--rating-size              /* Star size: small=1rem, medium=1.5rem, large=2rem */
--snice-font-family
--snice-transition-fast
--snice-focus-ring-width
--snice-focus-ring-color
--snice-focus-ring-offset
```

**CSS Parts:**
- `base` - Outer rating container
- `star` - Individual star/icon element

## Accessibility

Uses `role="radiogroup"` with individual `role="radio"` stars. Keyboard accessible when not readonly.

## Usage

```html
<snice-rating value="3.5" max="5" precision="half" size="large"></snice-rating>
<snice-rating value="4" readonly></snice-rating>
<snice-rating icon="&#x2764;" max="10"></snice-rating>
```

```js
const rating = document.querySelector('snice-rating');
rating.addEventListener('rating-change', (e) => {
  console.log('New rating:', e.detail.value);
});
```

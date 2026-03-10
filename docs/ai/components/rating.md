# snice-rating

Interactive star rating input with full/half precision, custom icons, and keyboard navigation.

## Properties

```typescript
value: number = 0;
max: number = 5;
icon: string = '★';
size: 'small'|'medium'|'large' = 'medium';
readonly: boolean = false;
precision: 'full'|'half' = 'full';
```

## Events

- `rating-change` → `{ value: number }`

## CSS Custom Properties

- `--rating-color` - Filled star color (`var(--snice-color-warning)`)
- `--rating-color-empty` - Empty star color (`var(--snice-color-border)`)
- `--rating-size` - Star size (auto-set by `size`: small=1rem, medium=1.5rem, large=2rem)

## CSS Parts

- `base` - Outer rating container
- `star` - Individual star/icon element

## Basic Usage

```html
<snice-rating value="3.5" precision="half" max="5"></snice-rating>
<snice-rating value="4" readonly></snice-rating>
<snice-rating icon="❤" value="3" max="5"></snice-rating>
<snice-rating value="4" size="large"></snice-rating>
```

```typescript
rating.addEventListener('rating-change', (e) => {
  console.log('New rating:', e.detail.value);
});
```

## Keyboard Navigation

- ArrowRight/Up: increase by step (1 or 0.5)
- ArrowLeft/Down: decrease by step

## Accessibility

- `role="radiogroup"` with `role="radio"` per star
- Not focusable when readonly
- Focus ring on keyboard navigation

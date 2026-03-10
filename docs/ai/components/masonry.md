# snice-masonry

Pinterest-style masonry layout using CSS columns.

## Properties

```ts
columns: number = 3;                  // Column count (0 = auto based on minColumnWidth)
gap: string = '1rem';                 // Gap between items
minColumnWidth: string = '250px';     // attr: min-column-width, min width when columns=0
```

## Slots

- `(default)` - Items to arrange in masonry layout

## CSS Parts

- `base` - Masonry layout container

## Basic Usage

```typescript
import 'snice/components/masonry/snice-masonry';
```

```html
<!-- Fixed columns -->
<snice-masonry columns="3" gap="1rem">
  <div>Card 1</div>
  <div>Card 2</div>
  <div>Card 3</div>
</snice-masonry>

<!-- Auto-responsive columns -->
<snice-masonry columns="0" min-column-width="300px">
  <div>Card 1</div>
  <div>Card 2</div>
</snice-masonry>

<!-- Custom gap -->
<snice-masonry columns="4" gap="0.5rem">
  <div>Card 1</div>
  <div>Card 2</div>
</snice-masonry>
```

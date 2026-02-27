# snice-masonry

Pinterest-style masonry layout using CSS columns.

## Properties

```typescript
columns: number = 3;                  // Column count (0 = auto based on minColumnWidth)
gap: string = '1rem';                 // Gap between items
minColumnWidth: string = '250px';     // attr: min-column-width, min width when columns=0
```

## Slots

- `(default)` - Items to arrange in masonry layout

## Usage

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

**CSS Parts:**
- `base` - The masonry layout container

## Features

- CSS columns-based layout (no JS measurement)
- Auto-responsive when columns=0
- Configurable gap
- Items flow top-to-bottom, left-to-right
- `break-inside: avoid` on slotted children
- `role="list"` for accessibility

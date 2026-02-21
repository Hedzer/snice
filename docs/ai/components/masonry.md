# snice-masonry

Pinterest-style masonry layout using CSS columns.

## Properties

```typescript
columns: number = 3;           // Column count (0 = auto based on minColumnWidth)
gap: string = '1rem';          // Gap between items
minColumnWidth: string = '250px'; // Min column width when columns=0
```

## Usage

```html
<!-- Basic 3-column masonry -->
<snice-masonry columns="3" gap="1rem">
  <div>Card 1</div>
  <div>Card 2</div>
  <div>Card 3</div>
</snice-masonry>

<!-- Auto columns based on min width -->
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

## Features

- CSS columns-based layout (no JS measurement)
- Auto-responsive when columns=0
- Configurable gap via CSS variable
- Items flow top-to-bottom, left-to-right
- `break-inside: avoid` on slotted children
- `role="list"` for accessibility

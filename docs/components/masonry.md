[//]: # (AI: For a low-token version of this doc, use docs/ai/components/masonry.md instead)

# Masonry
`<snice-masonry>`

A Pinterest-style layout that arranges items in columns with variable heights using CSS columns.

## Basic Usage

```typescript
import 'snice/components/masonry/snice-masonry';
```

```html
<snice-masonry columns="3" gap="1rem">
  <div>Card 1</div>
  <div>Card 2</div>
  <div>Card 3</div>
  <div>Card 4</div>
</snice-masonry>
```

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/masonry/snice-masonry';
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-masonry.min.js"></script>
```

## Examples

### Fixed Column Count

```html
<snice-masonry columns="3" gap="1rem">
  <div style="height:200px">Card 1</div>
  <div style="height:150px">Card 2</div>
  <div style="height:250px">Card 3</div>
  <div style="height:180px">Card 4</div>
</snice-masonry>
```

### Auto-Responsive Columns

Set `columns` to `0` to auto-calculate column count based on `min-column-width`.

```html
<snice-masonry columns="0" min-column-width="300px" gap="1rem">
  <div>Card 1</div>
  <div>Card 2</div>
  <div>Card 3</div>
  <div>Card 4</div>
</snice-masonry>
```

### Gap Sizes

Use the `gap` attribute with any CSS length value.

```html
<snice-masonry columns="4" gap="0.5rem">
  <div>Tight spacing</div>
  <div>Between cards</div>
</snice-masonry>

<snice-masonry columns="2" gap="2rem">
  <div>Wide spacing</div>
  <div>Between cards</div>
</snice-masonry>
```

### Photo Gallery

```html
<snice-masonry columns="3" gap="0.75rem">
  <img src="photo1.jpg" alt="Landscape" style="width:100%;border-radius:8px">
  <img src="photo2.jpg" alt="Portrait" style="width:100%;border-radius:8px">
  <img src="photo3.jpg" alt="Abstract" style="width:100%;border-radius:8px">
  <img src="photo4.jpg" alt="Nature" style="width:100%;border-radius:8px">
</snice-masonry>
```

### Dynamic Content

```html
<snice-masonry id="grid" columns="3" gap="1rem"></snice-masonry>
<button id="addBtn">Add Card</button>

<script type="module">
  import 'snice/components/masonry/snice-masonry';

  const masonry = document.getElementById('grid');
  let count = 0;

  document.getElementById('addBtn').addEventListener('click', () => {
    count++;
    const card = document.createElement('div');
    card.style.height = `${100 + Math.random() * 200}px`;
    card.textContent = `Card ${count}`;
    masonry.appendChild(card);
  });
</script>
```

## Slots

| Name | Description |
|------|-------------|
| (default) | Items to arrange in the masonry layout |

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `columns` | `number` | `3` | Number of columns (0 for auto based on `minColumnWidth`) |
| `gap` | `string` | `'1rem'` | Gap between items (any CSS length) |
| `minColumnWidth` (attr: `min-column-width`) | `string` | `'250px'` | Minimum column width when `columns` is 0 |

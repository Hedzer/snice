# Masonry Component

The masonry component provides a Pinterest-style layout that arranges items in columns with variable heights. Items flow top-to-bottom within each column, filling space efficiently. Built with CSS columns for simplicity and reliability.

## Table of Contents
- [Basic Usage](#basic-usage)
- [Properties](#properties)
- [Examples](#examples)

## Basic Usage

```html
<snice-masonry columns="3" gap="1rem">
  <div class="card">Item 1</div>
  <div class="card">Item 2</div>
  <div class="card">Item 3</div>
  <div class="card">Item 4</div>
</snice-masonry>
```

```typescript
import 'snice/components/masonry/snice-masonry';
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `columns` | `number` | `3` | Number of columns. Set to `0` for auto-calculation based on `minColumnWidth` |
| `gap` | `string` | `'1rem'` | Gap between items (any CSS length value) |
| `minColumnWidth` | `string` | `'250px'` | Minimum column width when `columns` is `0` |

## Examples

### Fixed Column Count

```html
<snice-masonry columns="3" gap="1rem">
  <div class="card" style="height: 200px;">Card 1</div>
  <div class="card" style="height: 150px;">Card 2</div>
  <div class="card" style="height: 250px;">Card 3</div>
  <div class="card" style="height: 180px;">Card 4</div>
  <div class="card" style="height: 220px;">Card 5</div>
  <div class="card" style="height: 160px;">Card 6</div>
</snice-masonry>
```

### Auto-Responsive Columns

When `columns` is set to `0`, the layout automatically calculates column count based on `minColumnWidth`:

```html
<snice-masonry columns="0" min-column-width="300px" gap="1rem">
  <div class="card">Card 1</div>
  <div class="card">Card 2</div>
  <div class="card">Card 3</div>
  <div class="card">Card 4</div>
</snice-masonry>
```

### Different Gap Sizes

```html
<!-- Tight spacing -->
<snice-masonry columns="4" gap="0.5rem">
  <div class="card">Item 1</div>
  <div class="card">Item 2</div>
</snice-masonry>

<!-- Wide spacing -->
<snice-masonry columns="2" gap="2rem">
  <div class="card">Item 1</div>
  <div class="card">Item 2</div>
</snice-masonry>
```

### Photo Gallery

```html
<snice-masonry columns="3" gap="0.75rem">
  <img src="photo1.jpg" alt="Photo 1" style="width: 100%; border-radius: 8px;">
  <img src="photo2.jpg" alt="Photo 2" style="width: 100%; border-radius: 8px;">
  <img src="photo3.jpg" alt="Photo 3" style="width: 100%; border-radius: 8px;">
  <img src="photo4.jpg" alt="Photo 4" style="width: 100%; border-radius: 8px;">
  <img src="photo5.jpg" alt="Photo 5" style="width: 100%; border-radius: 8px;">
</snice-masonry>
```

### Card Layout

```html
<style>
  .masonry-card {
    padding: 1rem;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
  }
</style>

<snice-masonry columns="3" gap="1rem">
  <div class="masonry-card">
    <h3>Short Card</h3>
    <p>Brief content.</p>
  </div>
  <div class="masonry-card">
    <h3>Tall Card</h3>
    <p>This card has more content to demonstrate variable heights in the masonry layout.</p>
    <p>Additional paragraph for height.</p>
  </div>
  <div class="masonry-card">
    <h3>Medium Card</h3>
    <p>Some content here.</p>
  </div>
  <div class="masonry-card">
    <h3>Another Card</h3>
    <p>More content to fill the grid.</p>
  </div>
</snice-masonry>
```

### Dynamic Content

```html
<snice-masonry id="dynamic-masonry" columns="3" gap="1rem">
</snice-masonry>

<button onclick="addCard()">Add Card</button>

<script type="module">
  const masonry = document.getElementById('dynamic-masonry');
  let count = 0;

  window.addCard = () => {
    count++;
    const card = document.createElement('div');
    card.className = 'masonry-card';
    card.style.height = `${100 + Math.random() * 200}px`;
    card.textContent = `Card ${count}`;
    masonry.appendChild(card);
  };
</script>
```

## Accessibility

- **ARIA role**: Container has `role="list"` for screen reader context
- **Semantic children**: Items can use `role="listitem"` for full list semantics
- **Tab order**: Items maintain DOM order for keyboard navigation

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires Custom Elements v1 and Shadow DOM support
- CSS `column-count` and `column-gap` are widely supported

## Best Practices

1. **Use variable heights**: Masonry works best when items have different heights
2. **Set appropriate column count**: 3-4 columns work well for most layouts
3. **Use auto columns for responsive**: Set `columns="0"` with `min-column-width` for adaptive layouts
4. **Keep items lightweight**: Avoid heavy content that slows rendering
5. **Add border-radius and shadows**: Visual cards look great in masonry layouts
6. **Test with different content**: Ensure layout works with varying item sizes

## How It Works

The component uses CSS `column-count` and `column-gap` to create the masonry effect. Each slotted child receives `break-inside: avoid` to prevent items from splitting across columns. When `columns` is set to `0`, the component uses `column-width` instead of `column-count`, allowing the browser to auto-calculate the optimal number of columns based on available space.

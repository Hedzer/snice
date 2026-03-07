<!-- AI: For a low-token version of this doc, use docs/ai/components/virtual-scroller.md instead -->

# Virtual Scroller
`<snice-virtual-scroller>`

Efficiently renders large lists by only displaying visible items.

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/virtual-scroller/snice-virtual-scroller';
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-virtual-scroller.min.js"></script>
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `items` | `VirtualScrollerItem[]` | `[]` | Array of items to render |
| `itemHeight` (attr: `item-height`) | `number` | `50` | Default item height (px) |
| `bufferSize` (attr: `buffer-size`) | `number` | `5` | Extra items rendered outside viewport |
| `estimatedItemHeight` (attr: `estimated-item-height`) | `number` | `50` | Estimated height for variable items |
| `renderItem` | `(item: VirtualScrollerItem, index: number) => string \| HTMLElement` | -- | Function to render each item (JS property only) |

### VirtualScrollerItem Interface

```typescript
interface VirtualScrollerItem {
  id: string | number;
  data: any;
  height?: number;
}
```

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `scrollToIndex()` | `index: number` | Scroll to item at index |
| `scrollToItem()` | `id: string \| number` | Scroll to item by ID |
| `refresh()` | -- | Recalculate visible range and re-render |
| `getVisibleRange()` | -- | Returns `{ start: number, end: number }` |

## CSS Parts

Style internal elements from outside the shadow DOM using `::part()`.

| Part | Element | Description |
|------|---------|-------------|
| `base` | `<div>` | The outer scroller container |

```css
snice-virtual-scroller::part(base) {
  scrollbar-width: thin;
  scrollbar-color: #94a3b8 transparent;
}
```

## Basic Usage

```typescript
import 'snice/components/virtual-scroller/snice-virtual-scroller';
```

```html
<snice-virtual-scroller id="list" style="height: 400px;"></snice-virtual-scroller>

<script>
  const scroller = document.getElementById('list');

  scroller.items = Array.from({ length: 10000 }, (_, i) => ({
    id: i,
    data: `Item ${i + 1}`
  }));

  scroller.renderItem = (item) => {
    return `<div style="padding: 15px; border-bottom: 1px solid #eee;">${item.data}</div>`;
  };
</script>
```

## Examples

### Custom Item Height

Use the `item-height` attribute to set the height of each item in pixels.

```html
<snice-virtual-scroller item-height="80" style="height: 600px;"></snice-virtual-scroller>
```

### Variable Height Items

Set individual `height` values on items for variable row heights.

```javascript
scroller.items = Array.from({ length: 1000 }, (_, i) => ({
  id: i,
  data: { title: `Post ${i + 1}` },
  height: i % 2 === 0 ? 60 : 100
}));
```

### Custom Buffer Size

Use the `buffer-size` attribute to control how many extra items are rendered outside the viewport.

```html
<snice-virtual-scroller buffer-size="10" style="height: 400px;"></snice-virtual-scroller>
```

### Programmatic Scrolling

```javascript
scroller.scrollToIndex(500);          // Scroll to index
scroller.scrollToItem('item-123');    // Scroll to item by ID
scroller.refresh();                   // Recalculate layout

const range = scroller.getVisibleRange();
console.log(`Showing items ${range.start} to ${range.end}`);
```

### User List

```javascript
scroller.items = Array.from({ length: 5000 }, (_, i) => ({
  id: i,
  data: { name: `User ${i + 1}`, email: `user${i + 1}@example.com` }
}));

scroller.renderItem = (item) => {
  return `<div style="padding: 12px;">
    <div style="font-weight: 600;">${item.data.name}</div>
    <div style="color: #666;">${item.data.email}</div>
  </div>`;
};
```

### Filtering

```javascript
const allItems = Array.from({ length: 10000 }, (_, i) => ({
  id: i,
  data: { name: `Item ${i + 1}` }
}));

scroller.items = allItems;

function filterItems(query) {
  scroller.items = query
    ? allItems.filter(item => item.data.name.toLowerCase().includes(query.toLowerCase()))
    : allItems;
  scroller.refresh();
}
```

### Dynamic Updates

```javascript
// Add item
scroller.items = [...scroller.items, { id: Date.now(), data: newData }];
scroller.refresh();

// Remove item
scroller.items = scroller.items.filter(item => item.id !== targetId);
scroller.refresh();
```

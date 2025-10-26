# Virtual Scroller Component

Efficiently render large lists by only displaying visible items.

## Basic Usage

```javascript
const scroller = document.querySelector('snice-virtual-scroller');

scroller.items = Array.from({ length: 10000 }, (_, i) => ({
  id: i,
  data: `Item ${i}`
}));

scroller.renderItem = (item, index) => {
  return `<div>${item.data}</div>`;
};
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `items` | `VirtualScrollerItem[]` | `[]` | Array of items to render |
| `itemHeight` | `number` | `50` | Height of each item (px) |
| `bufferSize` | `number` | `5` | Extra items to render outside viewport |
| `estimatedItemHeight` | `number` | `50` | Estimated height for variable items |
| `renderItem` | `Function` | - | Function to render each item |

## VirtualScrollerItem Interface

```typescript
interface VirtualScrollerItem {
  id: string | number;  // Unique identifier
  data: any;           // Item data
  height?: number;     // Optional custom height
}
```

## Methods

### `scrollToIndex(index: number): void`
Scroll to specific item index.

```javascript
scroller.scrollToIndex(500);
```

### `scrollToItem(id: string | number): void`
Scroll to item by ID.

```javascript
scroller.scrollToItem('item-123');
```

### `refresh(): void`
Recalculate visible range and re-render.

```javascript
scroller.refresh();
```

### `getVisibleRange(): { start: number; end: number }`
Get currently visible item indices.

```javascript
const range = scroller.getVisibleRange();
console.log(`Showing items ${range.start} to ${range.end}`);
```

## Examples

### Simple List

```javascript
const scroller = document.querySelector('snice-virtual-scroller');

scroller.items = Array.from({ length: 10000 }, (_, i) => ({
  id: i,
  data: `Item ${i + 1}`
}));

scroller.renderItem = (item) => {
  return `<div style="padding: 15px; border-bottom: 1px solid #eee;">
    ${item.data}
  </div>`;
};
```

### User List

```javascript
scroller.items = Array.from({ length: 5000 }, (_, i) => ({
  id: i,
  data: {
    name: `User ${i + 1}`,
    email: `user${i + 1}@example.com`
  }
}));

scroller.renderItem = (item) => {
  return `<div class="user-item">
    <div class="user-name">${item.data.name}</div>
    <div class="user-email">${item.data.email}</div>
  </div>`;
};
```

### Variable Height Items

```javascript
scroller.items = Array.from({ length: 1000 }, (_, i) => ({
  id: i,
  data: {
    title: `Post ${i + 1}`,
    content: i % 2 === 0 ? 'Short content' : 'Longer content with more text...'
  },
  height: i % 2 === 0 ? 60 : 100
}));

scroller.renderItem = (item) => {
  return `<div style="padding: 15px;">
    <h3>${item.data.title}</h3>
    <p>${item.data.content}</p>
  </div>`;
};
```

### Custom Item Height

```html
<snice-virtual-scroller
  style="height: 600px;"
  item-height="80">
</snice-virtual-scroller>
```

### Custom Buffer Size

```html
<snice-virtual-scroller
  buffer-size="10"
  style="height: 400px;">
</snice-virtual-scroller>
```

### Programmatic Scrolling

```javascript
// Scroll to top
scroller.scrollToIndex(0);

// Scroll to middle
scroller.scrollToIndex(Math.floor(scroller.items.length / 2));

// Scroll to specific item
scroller.scrollToItem('item-500');
```

### With Search

```javascript
const allItems = Array.from({ length: 10000 }, (_, i) => ({
  id: i,
  data: { name: `Item ${i + 1}`, value: i }
}));

scroller.items = allItems;

// Filter items
function filterItems(query) {
  if (!query) {
    scroller.items = allItems;
  } else {
    scroller.items = allItems.filter(item =>
      item.data.name.toLowerCase().includes(query.toLowerCase())
    );
  }
  scroller.refresh();
}
```

### With Sorting

```javascript
function sortItems(field, order = 'asc') {
  scroller.items = [...scroller.items].sort((a, b) => {
    const aVal = a.data[field];
    const bVal = b.data[field];
    return order === 'asc' ? aVal - bVal : bVal - aVal;
  });
  scroller.refresh();
}
```

### Complex Item Rendering

```javascript
scroller.renderItem = (item, index) => {
  return `
    <div class="complex-item" data-id="${item.id}">
      <div class="item-header">
        <img src="${item.data.avatar}" alt="${item.data.name}">
        <span>${item.data.name}</span>
        <span class="badge">${item.data.status}</span>
      </div>
      <div class="item-content">
        ${item.data.description}
      </div>
      <div class="item-footer">
        <button onclick="handleEdit(${item.id})">Edit</button>
        <button onclick="handleDelete(${item.id})">Delete</button>
      </div>
    </div>
  `;
};
```

### Infinite Scroll

```javascript
let currentPage = 1;
const itemsPerPage = 100;

async function loadMore() {
  const newItems = await fetchItems(currentPage);

  scroller.items = [
    ...scroller.items,
    ...newItems
  ];

  scroller.refresh();
  currentPage++;
}

scroller.addEventListener('scroll', (e) => {
  const { scrollTop, scrollHeight, clientHeight } = e.target;

  // Load more when near bottom
  if (scrollHeight - scrollTop - clientHeight < 200) {
    loadMore();
  }
});
```

### Dynamic Updates

```javascript
// Add item
function addItem(data) {
  scroller.items = [
    ...scroller.items,
    { id: Date.now(), data }
  ];
  scroller.refresh();
}

// Remove item
function removeItem(id) {
  scroller.items = scroller.items.filter(item => item.id !== id);
  scroller.refresh();
}

// Update item
function updateItem(id, newData) {
  scroller.items = scroller.items.map(item =>
    item.id === id ? { ...item, data: { ...item.data, ...newData } } : item
  );
  scroller.refresh();
}
```

## Performance

Virtual scrolling provides significant performance benefits for large lists:

- **Without virtual scrolling:** 10,000 items = 10,000 DOM elements
- **With virtual scrolling:** 10,000 items = ~20-30 DOM elements (only visible items)

This results in:
- Faster initial render
- Smooth 60fps scrolling
- Lower memory usage
- Better overall UX

## Accessibility

- Maintains scroll position
- Keyboard navigation supported
- Screen readers can navigate items
- Supports ARIA attributes in rendered items

## Browser Support

- Modern browsers with Custom Elements v1 support
- Uses CSS transforms for smooth scrolling
- Efficient rendering with minimal reflows

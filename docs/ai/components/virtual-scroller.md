# snice-virtual-scroller

Efficiently render large lists by only displaying visible items.

## Properties

```typescript
items: VirtualScrollerItem[] = [];
itemHeight: number = 50; // px
bufferSize: number = 5; // extra items outside viewport
estimatedItemHeight: number = 50;
renderItem: (item: VirtualScrollerItem, index: number) => string | HTMLElement;
```

## VirtualScrollerItem

```typescript
interface VirtualScrollerItem {
  id: string | number;
  data: any;
  height?: number; // optional custom height
}
```

## Methods

```typescript
scrollToIndex(index: number): void
scrollToItem(id: string | number): void
refresh(): void
getVisibleRange(): { start: number; end: number }
```

## Usage

```javascript
scroller.items = Array.from({ length: 10000 }, (_, i) => ({
  id: i,
  data: `Item ${i}`
}));

scroller.renderItem = (item, index) => {
  return `<div>${item.data}</div>`;
};

// Scroll to item
scroller.scrollToIndex(500);

// Get visible range
const range = scroller.getVisibleRange();
```

```html
<snice-virtual-scroller
  style="height: 400px;"
  item-height="60"
  buffer-size="10">
</snice-virtual-scroller>
```

## Features

- Only renders visible items + buffer
- Handles thousands of items efficiently
- Variable item heights supported
- Programmatic scrolling
- Dynamic updates (add/remove/update)
- Smooth 60fps scrolling
- Low memory footprint
- Search and filter support
- Infinite scroll patterns

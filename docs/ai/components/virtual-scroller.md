# snice-virtual-scroller

Efficiently renders large lists by only displaying visible items.

## Properties

```typescript
items: VirtualScrollerItem[] = [];
itemHeight: number = 50;              // attr: item-height, px
bufferSize: number = 5;               // attr: buffer-size
estimatedItemHeight: number = 50;     // attr: estimated-item-height
renderItem: (item: VirtualScrollerItem, index: number) => string | HTMLElement;  // JS property only

interface VirtualScrollerItem {
  id: string | number;
  data: any;
  height?: number;
}
```

## Methods

- `scrollToIndex(index)` - Scroll to item at index
- `scrollToItem(id)` - Scroll to item by ID
- `refresh()` - Recalculate visible range and re-render
- `getVisibleRange()` - Returns `{ start, end }`

## CSS Parts

- `base` - The outer scroller container

## Basic Usage

```html
<snice-virtual-scroller style="height: 400px;" item-height="60"></snice-virtual-scroller>
```

```typescript
scroller.items = Array.from({ length: 10000 }, (_, i) => ({
  id: i,
  data: { name: `Item ${i + 1}` }
}));

scroller.renderItem = (item) => {
  return `<div style="padding: 15px;">${item.data.name}</div>`;
};

scroller.scrollToIndex(500);
const range = scroller.getVisibleRange();
```

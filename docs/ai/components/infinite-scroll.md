# snice-infinite-scroll

Container that emits a load event when the user scrolls near the end, enabling infinite scrolling patterns.

## Properties

```ts
threshold: number          // Distance from edge (px) to trigger load
loading: boolean           // Whether a load is currently in progress
hasMore: boolean           // Whether more content is available
direction: InfiniteScrollDirection  // 'down' | 'up' — scroll direction to watch
```

## Events

- `load-more` -> `void` — Fires when scroll position crosses the threshold

## Usage

```html
<snice-infinite-scroll threshold="200" direction="down">
  <!-- scrollable content here -->
</snice-infinite-scroll>
```

```js
const scroller = document.querySelector('snice-infinite-scroll');
scroller.hasMore = true;
scroller.addEventListener('load-more', async () => {
  scroller.loading = true;
  const items = await fetchMoreItems();
  appendItems(items);
  scroller.loading = false;
  if (items.length === 0) scroller.hasMore = false;
});
```

## Notes

- Implementation is types-only at this time; the component source is pending.
- Set `loading = true` during fetch to prevent duplicate triggers.
- Set `hasMore = false` when all data is loaded to stop further events.

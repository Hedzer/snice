[//]: # (AI: For a low-token version of this doc, use docs/ai/components/infinite-scroll.md instead)

# Infinite Scroll Component

`<snice-infinite-scroll>`

The infinite scroll component is a container that emits a load event when the user scrolls near the end of its content, enabling infinite scrolling patterns for lists and feeds.

## Table of Contents
- [Basic Usage](#basic-usage)
- [Properties](#properties)
- [Events](#events)
- [Examples](#examples)
- [Accessibility](#accessibility)

## Basic Usage

```typescript
import 'snice/components/infinite-scroll/snice-infinite-scroll';
```

```html
<snice-infinite-scroll>
  <!-- scrollable content here -->
</snice-infinite-scroll>
```

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/infinite-scroll/snice-infinite-scroll';
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-infinite-scroll.min.js"></script>
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `threshold` | `number` | `200` | Distance in pixels from the edge at which to trigger a load event |
| `loading` | `boolean` | `false` | Whether a load operation is currently in progress. Set to `true` to prevent duplicate triggers |
| `hasMore` (attr: `has-more`) | `boolean` | `true` | Whether more content is available. Set to `false` to stop emitting load events |
| `direction` | `'down' \| 'up'` | `'down'` | Which scroll direction to watch for triggering the load event |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `load-more` | `void` | Fired when the scroll position crosses the threshold distance from the edge |

## Examples

### Basic Infinite List

Load more items when the user scrolls near the bottom of the container.

```html
<snice-infinite-scroll id="feed" threshold="200" style="height: 400px; overflow: auto;">
  <div id="items"></div>
</snice-infinite-scroll>

<script type="module">
  import 'snice/components/infinite-scroll/snice-infinite-scroll';

  const scroller = document.getElementById('feed');
  const items = document.getElementById('items');
  let page = 1;

  scroller.hasMore = true;

  scroller.addEventListener('load-more', async () => {
    scroller.loading = true;

    const response = await fetch(`/api/items?page=${page}`);
    const data = await response.json();

    data.forEach(item => {
      const div = document.createElement('div');
      div.textContent = item.title;
      items.appendChild(div);
    });

    page++;
    scroller.loading = false;

    if (data.length === 0) {
      scroller.hasMore = false;
    }
  });
</script>
```

### Custom Threshold

Use a larger `threshold` to trigger loading earlier, giving content more time to load before the user reaches the end.

```html
<snice-infinite-scroll threshold="500" style="height: 600px; overflow: auto;">
  <div id="content"></div>
</snice-infinite-scroll>
```

### Reverse Scroll (Chat History)

Use `direction="up"` to load older content when the user scrolls to the top, useful for chat-style interfaces.

```html
<snice-infinite-scroll id="chat" direction="up" threshold="100" style="height: 500px; overflow: auto;">
  <div id="messages"></div>
</snice-infinite-scroll>

<script type="module">
  import 'snice/components/infinite-scroll/snice-infinite-scroll';

  const scroller = document.getElementById('chat');

  scroller.addEventListener('load-more', async () => {
    scroller.loading = true;

    const olderMessages = await fetchOlderMessages();
    const container = document.getElementById('messages');

    olderMessages.forEach(msg => {
      const div = document.createElement('div');
      div.textContent = msg.text;
      container.prepend(div);
    });

    scroller.loading = false;

    if (olderMessages.length === 0) {
      scroller.hasMore = false;
    }
  });
</script>
```

### End-of-List Detection

Stop loading when all data has been fetched by setting `hasMore` to `false`.

```html
<snice-infinite-scroll id="products" style="height: 400px; overflow: auto;">
  <div id="product-list"></div>
</snice-infinite-scroll>

<script type="module">
  import 'snice/components/infinite-scroll/snice-infinite-scroll';

  const scroller = document.getElementById('products');
  let cursor = null;

  scroller.addEventListener('load-more', async () => {
    scroller.loading = true;

    const url = cursor ? `/api/products?cursor=${cursor}` : '/api/products';
    const { items, nextCursor } = await fetch(url).then(r => r.json());

    items.forEach(item => {
      const card = document.createElement('div');
      card.innerHTML = `<h3>${item.name}</h3><p>${item.price}</p>`;
      document.getElementById('product-list').appendChild(card);
    });

    cursor = nextCursor;
    scroller.loading = false;
    scroller.hasMore = !!nextCursor;
  });
</script>
```

## Accessibility

- The component acts as a scrollable container and inherits standard scroll behavior
- Screen readers will announce content as it is added to the DOM
- Use `aria-live="polite"` on the content container to announce new items to assistive technology
- Keyboard users can scroll the container using standard arrow keys and Page Up/Page Down

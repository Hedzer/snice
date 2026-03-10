# snice-list

List container with search, infinite scroll, and composable list items.

## Components

- `<snice-list>` - Container with search, infinite scroll, loading
- `<snice-list-item>` - Individual item with heading, description, slots

## Properties

```ts
// snice-list
dividers: boolean = false;
searchable: boolean = false;
search: string = '';
infinite: boolean = false;
loading: boolean = false;
noResults: boolean = false;    // attr: no-results
threshold: number = 0.5;
skeletonCount: number = 5;     // attr: skeleton-count

// snice-list-item
heading: string = '';
description: string = '';
selected: boolean = false;
disabled: boolean = false;
```

## Requests

- `list/search` → `{ query, list }` - Handle search (debounced 300ms)
- `list/load-more` → `{ page, list }` - Infinite scroll pagination

## Slots (snice-list)

- `(default)` - List items
- `before` - Content before items
- `after` - Content after items
- `no-results` - Custom empty state
- `loading` - Custom loading content

## Slots (snice-list-item)

- `(default)` - Custom content
- `before` - Icon/avatar area
- `after` - Badge/metadata area

## CSS Parts (snice-list)

- `container` - Outer list container
- `search` - Search input wrapper
- `loading` - Loading skeletons wrapper
- `sentinel` - Infinite scroll sentinel

## Basic Usage

```typescript
import 'snice/components/list/snice-list';
```

```html
<!-- Basic with dividers -->
<snice-list dividers>
  <snice-list-item heading="Inbox" description="3 unread"></snice-list-item>
  <snice-list-item heading="Sent" description="Last 2h ago"></snice-list-item>
</snice-list>

<!-- With icons -->
<snice-list-item heading="Downloads">
  <span slot="before">📥</span>
  <span slot="after">12</span>
</snice-list-item>

<!-- Searchable -->
<snice-list searchable dividers></snice-list>

<!-- Infinite scroll (needs scrollable parent) -->
<div style="height:300px;overflow-y:auto">
  <snice-list infinite></snice-list>
</div>

<!-- Loading / empty -->
<snice-list loading skeleton-count="3"></snice-list>
<snice-list no-results></snice-list>
```

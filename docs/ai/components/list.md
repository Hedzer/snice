# snice-list

List container with search, infinite scroll, and composable list items.

## Properties

```typescript
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

## Requests

- `list/search` → `{ query, list }` - Handle search
- `list/load-more` → `{ page, list }` - Infinite scroll

## Usage

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

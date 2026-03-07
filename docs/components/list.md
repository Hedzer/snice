<!-- AI: For a low-token version of this doc, use docs/ai/components/list.md instead -->

# List
`<snice-list>`

A list container with search, infinite scroll, loading states, and composable list items.

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/list/snice-list';
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-list.min.js"></script>
```

## List Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `dividers` | `boolean` | `false` | Shows separator lines between items |
| `searchable` | `boolean` | `false` | Shows a search input |
| `search` | `string` | `''` | Current search query value |
| `infinite` | `boolean` | `false` | Enables infinite scroll loading |
| `loading` | `boolean` | `false` | Shows loading skeletons |
| `noResults` (attr: `no-results`) | `boolean` | `false` | Shows empty state |
| `threshold` | `number` | `0.5` | Intersection threshold for infinite scroll |
| `skeletonCount` (attr: `skeleton-count`) | `number` | `5` | Number of skeleton placeholders |

## List Item Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `heading` | `string` | `''` | Item heading text |
| `description` | `string` | `''` | Item description text |
| `selected` | `boolean` | `false` | Highlights the item |
| `disabled` | `boolean` | `false` | Disables interaction |

## List Slots

| Name | Description |
|------|-------------|
| (default) | List item elements |
| `before` | Content before the list items |
| `after` | Content after the list items |
| `no-results` | Custom empty state (overrides default) |
| `loading` | Custom loading content (overrides skeleton) |

## List Item Slots

| Name | Description |
|------|-------------|
| (default) | Custom item content |
| `before` | Content before the item (e.g., icon) |
| `after` | Content after the item (e.g., badge) |

## Basic Usage

```typescript
import 'snice/components/list/snice-list';
```

```html
<snice-list>
  <snice-list-item heading="Inbox" description="3 unread messages"></snice-list-item>
  <snice-list-item heading="Drafts" description="2 drafts"></snice-list-item>
  <snice-list-item heading="Sent" description="Last sent 2 hours ago"></snice-list-item>
</snice-list>
```

## Examples

### Dividers

Use the `dividers` attribute to show separator lines between items.

```html
<snice-list dividers>
  <snice-list-item heading="General" description="General settings"></snice-list-item>
  <snice-list-item heading="Security" description="Password and 2FA"></snice-list-item>
  <snice-list-item heading="Notifications" description="Email preferences"></snice-list-item>
</snice-list>
```

### Items with Icons

Use the `before` and `after` slots on list items for icons and metadata.

```html
<snice-list dividers>
  <snice-list-item heading="Downloads" description="Manage your files">
    <span slot="before">📥</span>
    <span slot="after">12</span>
  </snice-list-item>
  <snice-list-item heading="Uploads" description="View upload history">
    <span slot="before">📤</span>
    <span slot="after">5</span>
  </snice-list-item>
</snice-list>
```

### Searchable List

Set the `searchable` attribute to show a search input. Handle queries with the `list/search` request.

```html
<snice-list searchable dividers>
  <snice-list-item heading="Alice Johnson"></snice-list-item>
  <snice-list-item heading="Bob Smith"></snice-list-item>
  <snice-list-item heading="Carol Williams"></snice-list-item>
</snice-list>
```

### Infinite Scroll

Set the `infinite` attribute inside a scrollable container to auto-load more items.

```html
<div style="height: 300px; overflow-y: auto;">
  <snice-list infinite>
    <snice-list-item heading="Item 1"></snice-list-item>
    <snice-list-item heading="Item 2"></snice-list-item>
  </snice-list>
</div>
```

### Loading State

Set the `loading` attribute to show skeleton placeholders.

```html
<snice-list loading skeleton-count="3"></snice-list>
```

### No Results

Set the `no-results` attribute to show an empty state message.

```html
<snice-list no-results></snice-list>
```

### Selected and Disabled Items

```html
<snice-list dividers>
  <snice-list-item heading="Active Plan" selected></snice-list-item>
  <snice-list-item heading="Enterprise" disabled></snice-list-item>
</snice-list>
```

## Requests

| Request | Params | Description |
|---------|--------|-------------|
| `list/search` | `{ query: string, list }` | Handle search queries |
| `list/load-more` | `{ page: number, list }` | Load next page for infinite scroll |

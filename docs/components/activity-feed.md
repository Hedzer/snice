<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/activity-feed.md -->

# Activity Feed
`<snice-activity-feed>`

A vertical timeline of activity entries for displaying audit logs, user activity streams, and event histories.

## Table of Contents
- [Components](#components)
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Accessibility](#accessibility)

## Components

| Element | Description |
|---------|-------------|
| `snice-activity-feed` | The feed container |
| `snice-activity-item` | Declarative data carrier child — the feed reads its attributes and renders the entry itself |

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `activities` | `Activity[]` | `[]` | Array of activity objects (set via JavaScript) |
| `filter` | `string` | `''` | Active filter by activity type |
| `groupBy` (attr: `group-by`) | `'none' \| 'date'` | `'none'` | Grouping mode; grouped feeds sort newest first |
| `hasMore` (attr: `has-more`) | `boolean` | `false` | Shows the "Load more" button |
| `refreshInterval` (attr: `refresh-interval`) | `number` | `60000` | Milliseconds between relative-timestamp refreshes; `0` disables |
| `emptyMessage` (attr: `empty-message`) | `string` | `'No activity to display.'` | Text shown when the feed is empty |
| `loadMoreLabel` (attr: `load-more-label`) | `string` | `'Load more'` | Label for the load-more button |
| `allLabel` (attr: `all-label`) | `string` | `'All'` | Label for the reset filter button |

### Activity Interface

```typescript
interface Activity {
  id: string;
  actor: { name: string; avatar?: string };  // avatar falls back to initials if the image fails
  action: string;
  target?: string;
  timestamp: string;                          // unparseable values display as-is
  icon?: string;                              // registry name ('star'), URL, or text
  type?: string;
  meta?: Record<string, unknown>;
}
```

The built-in types `create`, `update`, `delete`, `comment`, `deploy`, `login`, `upload`, and `download` map to icons from the built-in SVG registry.

### snice-activity-item Attributes

`item-id`, `actor-name`, `actor-avatar`, `action`, `target`, `timestamp`, `icon`, `type`. When any `snice-activity-item` children are present, they take precedence over the `activities` array.

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `addActivity()` | `activity: Activity` | Prepends an activity to the feed |
| `clearFilter()` | --- | Resets the active filter |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `activity-click` | `{ activity: Activity }` | Fired when an entry is clicked |
| `load-more` | `{ count: number }` | Fired when the "Load more" button is clicked (requires `has-more`) |

## CSS Parts

| Part | Description |
|------|-------------|
| `base` | Feed container |
| `filters` | Filter button bar |
| `list` | Activity list |
| `entry` | Single activity row |
| `icon` | Activity icon circle |
| `content` | Activity content area |
| `timestamp` | Timestamp text |
| `group-header` | Date group header |

## Basic Usage

```typescript
import 'snice/components/activity-feed/snice-activity-feed';
```

```html
<snice-activity-feed id="feed"></snice-activity-feed>

<script>
  document.getElementById('feed').activities = [
    { id: '1', actor: { name: 'Alice' }, action: 'created', target: 'Project Alpha', timestamp: '2024-01-15T10:30:00Z' },
    { id: '2', actor: { name: 'Bob' }, action: 'commented on', target: 'Issue #42', timestamp: '2024-01-15T11:00:00Z' }
  ];
</script>
```

## Examples

### Declarative Items

Slot `snice-activity-item` children for markup-only feeds. Slotted items win over the `activities` array.

```html
<snice-activity-feed>
  <snice-activity-item item-id="a1" actor-name="Alice" action="created" target="Project Alpha" type="create" timestamp="2024-01-15T10:30:00Z"></snice-activity-item>
  <snice-activity-item item-id="a2" actor-name="Bob" action="commented on" target="Issue #42" type="comment" timestamp="2024-01-15T11:00:00Z"></snice-activity-item>
</snice-activity-feed>
```

### Activity Types

Use the `type` property on activities to categorize them. Type badges appear next to the description and filter buttons render automatically.

```html
<snice-activity-feed id="typed-feed"></snice-activity-feed>

<script>
  document.getElementById('typed-feed').activities = [
    { id: '1', actor: { name: 'Alice' }, action: 'created', target: 'repo', timestamp: new Date().toISOString(), type: 'create' },
    { id: '2', actor: { name: 'Bob' }, action: 'commented on', target: 'PR #5', timestamp: new Date().toISOString(), type: 'comment' },
    { id: '3', actor: { name: 'Charlie' }, action: 'deployed', target: 'v2.0', timestamp: new Date().toISOString(), type: 'deploy' }
  ];
</script>
```

### Group by Date

Set the `group-by` attribute to `"date"` to group activities under date headers, newest group first.

```html
<snice-activity-feed id="grouped" group-by="date"></snice-activity-feed>
```

### Load More

Set the `has-more` attribute while more pages exist; remove it when the source is exhausted.

```html
<snice-activity-feed id="paged" has-more></snice-activity-feed>

<script>
  const paged = document.getElementById('paged');
  paged.addEventListener('load-more', async () => {
    const next = await fetchNextPage();
    paged.activities = [...paged.activities, ...next.items];
    if (!next.hasMore) paged.hasMore = false;
  });
</script>
```

### Custom Icons

Use the `icon` property on activities for custom entry icons. Registry names render built-in SVGs; URLs render images; any other text renders as-is.

```html
<snice-activity-feed id="icon-feed"></snice-activity-feed>

<script>
  document.getElementById('icon-feed').activities = [
    { id: '1', actor: { name: 'Alice' }, action: 'starred', target: 'repo', timestamp: new Date().toISOString(), icon: 'star' },
    { id: '2', actor: { name: 'Bob' }, action: 'merged', target: 'PR #12', timestamp: new Date().toISOString(), icon: 'arrows-right-left' }
  ];
</script>
```

### With Avatars

Provide an `avatar` URL on the actor for inline avatar images. If the image fails to load, the actor's initials render instead.

```html
<snice-activity-feed id="avatar-feed"></snice-activity-feed>

<script>
  document.getElementById('avatar-feed').activities = [
    { id: '1', actor: { name: 'Alice', avatar: 'alice.jpg' }, action: 'updated', target: 'Settings', timestamp: new Date().toISOString() }
  ];
</script>
```

### Adding Activities Programmatically

Use the `addActivity()` method to prepend new entries.

```javascript
const feed = document.getElementById('feed');
feed.addActivity({
  id: 'new-1',
  actor: { name: 'System' },
  action: 'deployed',
  target: 'v3.0.0',
  timestamp: new Date().toISOString(),
  type: 'deploy'
});
```

## Accessibility

- The list uses the ARIA feed pattern: `role="feed"` with `role="article"` entries carrying `aria-posinset` and `aria-setsize`
- Entries are keyboard focusable; Enter and Space activate them
- Filter buttons expose their state via `aria-pressed`
- Relative timestamps refresh automatically (`refresh-interval`)

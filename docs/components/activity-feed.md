<!-- AI: For a low-token version of this doc, use docs/ai/components/activity-feed.md instead -->

# Activity Feed
`<snice-activity-feed>`

A vertical timeline of activity entries for displaying audit logs, user activity streams, and event histories.

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/activity-feed/snice-activity-feed';
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-activity-feed.min.js"></script>
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `activities` | `Activity[]` | `[]` | Array of activity objects |
| `filter` | `string` | `''` | Active filter by activity type |
| `groupBy` (attr: `group-by`) | `'none' \| 'date'` | `'none'` | Grouping mode |

### Activity Interface

```typescript
interface Activity {
  id: string;
  actor: { name: string; avatar?: string };
  action: string;
  target?: string;
  timestamp: string;
  icon?: string;
  type?: string;
  meta?: Record<string, unknown>;
}
```

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `addActivity()` | `activity: Activity` | Prepends an activity to the feed |
| `clearFilter()` | --- | Resets the active filter |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `activity-click` | `{ activity: Activity }` | Fired when an entry is clicked |
| `load-more` | `{ count: number }` | Fired when "Load more" button is clicked |

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

Set the `group-by` attribute to `"date"` to group activities under date headers.

```html
<snice-activity-feed id="grouped" group-by="date"></snice-activity-feed>
```

### Custom Icons

Use the `icon` property on activities for custom entry icons.

```html
<snice-activity-feed id="icon-feed"></snice-activity-feed>

<script>
  document.getElementById('icon-feed').activities = [
    { id: '1', actor: { name: 'Alice' }, action: 'starred', target: 'repo', timestamp: new Date().toISOString(), icon: '\u2B50' },
    { id: '2', actor: { name: 'Bob' }, action: 'merged', target: 'PR #12', timestamp: new Date().toISOString(), icon: '\u{1F500}' }
  ];
</script>
```

### With Avatars

Provide an `avatar` URL on the actor for inline avatar images.

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

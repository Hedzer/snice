# snice-activity-feed

Activity/audit log feed with vertical timeline, filtering, and grouping.

## Properties

```typescript
activities: Activity[] = [];
filter: string = '';
groupBy: 'none'|'date' = 'none';  // attr: group-by

interface ActivityActor {
  name: string;
  avatar?: string;
}

interface Activity {
  id: string;
  actor: ActivityActor;
  action: string;
  target?: string;
  timestamp: string;
  icon?: string;
  type?: string;
  meta?: Record<string, unknown>;
}
```

## Events

- `activity-click` -> `{ activity: Activity }`
- `load-more` -> `{ count: number }`

## Methods

- `addActivity(activity)` - Prepend activity to feed
- `clearFilter()` - Reset filter to show all

## CSS Parts

- `base` - Feed container
- `filters` - Filter bar
- `list` - Activity list
- `entry` - Single activity row
- `icon` - Activity icon
- `content` - Activity content area
- `timestamp` - Timestamp text
- `group-header` - Date group header

## Usage

```html
<snice-activity-feed id="feed" group-by="date"></snice-activity-feed>
<script>
  const feed = document.getElementById('feed');
  feed.activities = [
    { id: '1', actor: { name: 'Alice', avatar: 'alice.jpg' }, action: 'created', target: 'Project Alpha', timestamp: '2024-01-15T10:30:00Z', type: 'create', icon: '+' },
    { id: '2', actor: { name: 'Bob' }, action: 'commented on', target: 'Issue #42', timestamp: '2024-01-15T11:00:00Z', type: 'comment' },
    { id: '3', actor: { name: 'Charlie' }, action: 'deployed', target: 'v2.0.0', timestamp: '2024-01-14T09:00:00Z', type: 'deploy' }
  ];
  feed.addEventListener('activity-click', e => console.log(e.detail.activity));
  feed.addEventListener('load-more', e => console.log('Load more, current:', e.detail.count));
</script>
```

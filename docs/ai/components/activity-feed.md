# snice-activity-feed

Activity/audit log feed with vertical timeline, filtering, and grouping.

## Components

- `snice-activity-feed` - The feed container
- `snice-activity-item` - Declarative data carrier child (never rendered directly)

## Properties

```typescript
activities: Activity[] = [];
filter: string = '';
groupBy: 'none'|'date' = 'none';         // attr: group-by; grouped mode sorts newest first
hasMore: boolean = false;                 // attr: has-more; shows the load-more button
refreshInterval: number = 60000;          // attr: refresh-interval; ms between relative-timestamp refreshes, 0 disables
emptyMessage: string = 'No activity to display.';  // attr: empty-message
loadMoreLabel: string = 'Load more';      // attr: load-more-label
allLabel: string = 'All';                 // attr: all-label; the reset filter button

interface ActivityActor {
  name: string;
  avatar?: string;                        // falls back to initials if the image fails to load
}

interface Activity {
  id: string;
  actor: ActivityActor;
  action: string;
  target?: string;
  timestamp: string;                      // unparseable values display as-is
  icon?: string;                          // registry name ('star'), URL, or text/emoji
  type?: string;                          // create|update|delete|comment|deploy|login|upload|download map to registry icons
  meta?: Record<string, unknown>;
}
```

`snice-activity-item` attributes: `item-id`, `actor-name`, `actor-avatar`, `action`, `target`, `timestamp`, `icon`, `type`. Slotted items take precedence over the `activities` array.

## Methods

- `addActivity(activity)` - Prepend activity to feed
- `clearFilter()` - Reset filter to show all

## Events

- `activity-click` → `{ activity: Activity }`
- `load-more` → `{ count: number }` (button only renders when `has-more` is set)

## CSS Parts

- `base` - Feed container
- `filters` - Filter bar
- `list` - Activity list (role="feed")
- `entry` - Single activity row (role="article")
- `icon` - Activity icon
- `content` - Activity content area
- `timestamp` - Timestamp text
- `group-header` - Date group header

## Basic Usage

```html
<snice-activity-feed group-by="date" has-more></snice-activity-feed>

<!-- Declarative -->
<snice-activity-feed>
  <snice-activity-item item-id="a1" actor-name="Alice" action="created" target="Project Alpha" type="create" timestamp="2024-01-15T10:30:00Z"></snice-activity-item>
</snice-activity-feed>
```

```typescript
feed.activities = [
  { id: '1', actor: { name: 'Alice', avatar: 'alice.jpg' }, action: 'created', target: 'Project Alpha', timestamp: '2024-01-15T10:30:00Z', type: 'create' },
  { id: '2', actor: { name: 'Bob' }, action: 'commented on', target: 'Issue #42', timestamp: '2024-01-15T11:00:00Z', type: 'comment' },
];
feed.addEventListener('activity-click', e => console.log(e.detail.activity));
feed.addEventListener('load-more', e => console.log('Load more, current:', e.detail.count));
feed.addActivity({ id: '3', actor: { name: 'System' }, action: 'deployed', target: 'v3.0', timestamp: new Date().toISOString(), type: 'deploy' });
```

## Accessibility

- List has `role="feed"`; entries are `role="article"` with `aria-posinset`/`aria-setsize`
- Entries: focusable, Enter/Space activates
- Filter buttons expose `aria-pressed`

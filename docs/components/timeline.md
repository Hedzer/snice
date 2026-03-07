<!-- AI: For a low-token version of this doc, use docs/ai/components/timeline.md instead -->

# Timeline
`<snice-timeline>`

Displays events in chronological order with markers, timestamps, and descriptions.

## Basic Usage

```typescript
import 'snice/components/timeline/snice-timeline';
```

```html
<snice-timeline id="timeline"></snice-timeline>

<script>
  document.getElementById('timeline').items = [
    { timestamp: '2024-01-15', title: 'Project Started', description: 'Initial planning phase' },
    { timestamp: '2024-01-20', title: 'Design Complete', description: 'Mockups approved' }
  ];
</script>
```

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/timeline/snice-timeline';
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-timeline.min.js"></script>
```

## Examples

### Horizontal

Use the `orientation` attribute for a horizontal layout.

```html
<snice-timeline orientation="horizontal" id="h-timeline"></snice-timeline>

<script>
  document.getElementById('h-timeline').items = [
    { title: 'Step 1', description: 'First step' },
    { title: 'Step 2', description: 'Second step' },
    { title: 'Step 3', description: 'Third step' }
  ];
</script>
```

### Alternate Position

Use `position="alternate"` for a zigzag layout.

```html
<snice-timeline position="alternate" id="alt-timeline"></snice-timeline>

<script>
  document.getElementById('alt-timeline').items = [
    { title: 'Event 1', timestamp: 'Jan 2024' },
    { title: 'Event 2', timestamp: 'Feb 2024' },
    { title: 'Event 3', timestamp: 'Mar 2024' }
  ];
</script>
```

### With Variants

Use the `variant` property on items to set marker colors.

```html
<snice-timeline id="variant-timeline"></snice-timeline>

<script>
  document.getElementById('variant-timeline').items = [
    { title: 'Completed', variant: 'success', description: 'Task finished' },
    { title: 'Warning', variant: 'warning', description: 'Attention needed' },
    { title: 'Error', variant: 'error', description: 'Action failed' }
  ];
</script>
```

### Custom Icons

Use the `icon` property on items for custom marker icons.

```html
<snice-timeline id="icon-timeline"></snice-timeline>

<script>
  document.getElementById('icon-timeline').items = [
    { title: 'Planning', icon: '1' },
    { title: 'Development', icon: '2' },
    { title: 'Launch', icon: '3' }
  ];
</script>
```

### Reversed Order

Set the `reverse` attribute to reverse item display order.

```html
<snice-timeline reverse id="reversed"></snice-timeline>
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `orientation` | `'vertical' \| 'horizontal'` | `'vertical'` | Timeline orientation |
| `position` | `'left' \| 'right' \| 'alternate'` | `'left'` | Item position (vertical only) |
| `items` | `TimelineItem[]` | `[]` | Timeline items |
| `reverse` | `boolean` | `false` | Reverse item order |

### TimelineItem Interface

```typescript
interface TimelineItem {
  timestamp?: string;
  title: string;
  description?: string;
  icon?: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
}
```

## CSS Parts

| Part | Description |
|------|-------------|
| `container` | Timeline container |
| `item` | Individual timeline item |
| `marker` | Item marker circle |
| `icon` | Marker icon |
| `content` | Item content area |
| `timestamp` | Timestamp text |
| `title` | Title text |
| `description` | Description text |

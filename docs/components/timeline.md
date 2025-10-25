# Timeline Component

The `<snice-timeline>` component displays events in chronological order with markers, timestamps, and descriptions.

## Basic Usage

```html
<snice-timeline id="timeline"></snice-timeline>

<script>
  const timeline = document.getElementById('timeline');
  timeline.items = [
    {
      timestamp: '2024-01-15',
      title: 'Event Title',
      description: 'Event description'
    }
  ];
</script>
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `orientation` | `'vertical' \| 'horizontal'` | `'vertical'` | Timeline orientation |
| `position` | `'left' \| 'right' \| 'alternate'` | `'left'` | Item position (vertical only) |
| `items` | `TimelineItem[]` | `[]` | Timeline items |
| `reverse` | `boolean` | `false` | Reverse item order |

## TimelineItem Interface

```typescript
interface TimelineItem {
  timestamp?: string;
  title: string;
  description?: string;
  icon?: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
}
```

## Examples

### Vertical Timeline

```html
<snice-timeline id="timeline"></snice-timeline>

<script>
  document.getElementById('timeline').items = [
    {
      timestamp: '2024-01-15 09:00',
      title: 'Project Started',
      description: 'Initial planning phase'
    },
    {
      timestamp: '2024-01-20 14:30',
      title: 'Design Complete',
      description: 'Mockups approved'
    }
  ];
</script>
```

### Horizontal Timeline

```html
<snice-timeline orientation="horizontal" id="horizontal-timeline"></snice-timeline>

<script>
  document.getElementById('horizontal-timeline').items = [
    { title: 'Step 1', description: 'First step' },
    { title: 'Step 2', description: 'Second step' },
    { title: 'Step 3', description: 'Third step' }
  ];
</script>
```

### Alternate Position

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

```html
<snice-timeline id="variant-timeline"></snice-timeline>

<script>
  document.getElementById('variant-timeline').items = [
    {
      title: 'Completed',
      variant: 'success',
      description: 'Task finished successfully'
    },
    {
      title: 'Warning',
      variant: 'warning',
      description: 'Attention needed'
    },
    {
      title: 'Error',
      variant: 'error',
      description: 'Action failed'
    }
  ];
</script>
```

### Custom Icons

```html
<snice-timeline id="icon-timeline"></snice-timeline>

<script>
  document.getElementById('icon-timeline').items = [
    { title: 'Planning', icon: '📋' },
    { title: 'Development', icon: '💻' },
    { title: 'Launch', icon: '🚀' }
  ];
</script>
```

### Reversed Order

```html
<snice-timeline reverse id="reversed-timeline"></snice-timeline>

<script>
  document.getElementById('reversed-timeline').items = [
    { title: 'Latest Event', timestamp: '2024-03-01' },
    { title: 'Earlier Event', timestamp: '2024-02-01' },
    { title: 'First Event', timestamp: '2024-01-01' }
  ];
</script>
```

## Styling

The component exposes several CSS parts for styling:

```css
snice-timeline::part(container) {
  /* Timeline container */
}

snice-timeline::part(item) {
  /* Timeline item */
}

snice-timeline::part(marker) {
  /* Item marker/circle */
}

snice-timeline::part(icon) {
  /* Marker icon */
}

snice-timeline::part(content) {
  /* Item content area */
}

snice-timeline::part(timestamp) {
  /* Timestamp text */
}

snice-timeline::part(title) {
  /* Title text */
}

snice-timeline::part(description) {
  /* Description text */
}
```

## Notes

- Items without timestamps will still render but won't display a timestamp
- Items without descriptions will only show the title
- Default icons are provided for each variant
- Horizontal timelines work best with 3-5 items
- Alternate positioning creates a zigzag layout

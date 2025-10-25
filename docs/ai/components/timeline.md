# snice-timeline

Displays chronological events with markers.

## Properties

```typescript
orientation: 'vertical'|'horizontal' = 'vertical';
position: 'left'|'right'|'alternate' = 'left';
items: TimelineItem[] = [];
reverse: boolean = false;
```

## TimelineItem

```typescript
interface TimelineItem {
  timestamp?: string;
  title: string;
  description?: string;
  icon?: string;
  variant?: 'default'|'success'|'warning'|'error'|'info';
}
```

## Usage

```html
<!-- Basic --><snice-timeline id="timeline"></snice-timeline>
<script>
timeline.items = [{
  timestamp: '2024-01-15',
  title: 'Event',
  description: 'Details'
}];
</script>

<!-- Vertical positions -->
<snice-timeline position="left"></snice-timeline>
<snice-timeline position="right"></snice-timeline>
<snice-timeline position="alternate"></snice-timeline>

<!-- Horizontal -->
<snice-timeline orientation="horizontal"></snice-timeline>

<!-- Variants -->
<script>
timeline.items = [
  { title: 'Success', variant: 'success' },
  { title: 'Warning', variant: 'warning' },
  { title: 'Error', variant: 'error' },
  { title: 'Info', variant: 'info' }
];
</script>

<!-- Custom icons -->
<script>
timeline.items = [
  { title: 'Planning', icon: '📋' },
  { title: 'Development', icon: '💻' },
  { title: 'Launch', icon: '🚀' }
];
</script>

<!-- Reversed -->
<snice-timeline reverse></snice-timeline>
```

## Features

- Vertical and horizontal orientations
- Left/right/alternate positioning (vertical)
- 5 item variants with default icons
- Custom icons supported
- Timestamps and descriptions optional
- Connecting lines between items
- Reversible order

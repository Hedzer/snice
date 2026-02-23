# snice-timeline

Displays chronological events with markers.

## Properties

```typescript
orientation: 'vertical'|'horizontal' = 'vertical';
position: 'left'|'right'|'alternate' = 'left';
items: TimelineItem[] = [];
reverse: boolean = false;

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
<snice-timeline id="timeline"></snice-timeline>
<script>
  document.getElementById('timeline').items = [
    { timestamp: '2024-01-15', title: 'Created', description: 'Project started', variant: 'success' },
    { timestamp: '2024-02-01', title: 'Review', description: 'In review', variant: 'warning', icon: '📋' },
    { timestamp: '2024-03-01', title: 'Launch', description: 'Deployed', variant: 'info', icon: '🚀' }
  ];
</script>

<snice-timeline position="alternate"></snice-timeline>
<snice-timeline position="right"></snice-timeline>
<snice-timeline orientation="horizontal"></snice-timeline>
<snice-timeline reverse></snice-timeline>
```

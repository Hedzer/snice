# snice-timeline

Displays chronological events with markers, timestamps, and descriptions.

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

## CSS Parts

- `container` - Timeline container
- `item` - Individual timeline item
- `marker` - Item marker circle
- `icon` - Marker icon
- `content` - Item content area
- `timestamp` - Timestamp text
- `title` - Title text
- `description` - Description text

## Basic Usage

```html
<snice-timeline></snice-timeline>
```

```typescript
timeline.items = [
  { timestamp: '2024-01-15', title: 'Created', description: 'Project started', variant: 'success' },
  { timestamp: '2024-02-01', title: 'Review', description: 'In review', variant: 'warning', icon: '!' },
  { timestamp: '2024-03-01', title: 'Launch', description: 'Deployed', variant: 'info' }
];
```

```html
<snice-timeline position="alternate"></snice-timeline>
<snice-timeline position="right"></snice-timeline>
<snice-timeline orientation="horizontal"></snice-timeline>
<snice-timeline reverse></snice-timeline>
```

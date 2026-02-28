# snice-scheduler

Multi-resource week/day/month scheduler with drag-to-create, move, and resize events.

## Properties

```typescript
resources: SchedulerResource[] = [];
events: SchedulerEvent[] = [];
view: 'day'|'week'|'month' = 'week';
date: Date | string = new Date();
granularity: number = 60; // slot size in minutes (15, 30, 60)
startHour: number = 0;    // attr: start-hour
endHour: number = 24;     // attr: end-hour
```

## Interfaces

```typescript
interface SchedulerResource {
  id: string | number;
  name: string;
  avatar?: string;
  color?: string;
}

interface SchedulerEvent {
  id: string | number;
  resourceId: string | number;
  start: Date | string;
  end: Date | string;
  title: string;
  color?: string;
  data?: any;
}
```

## Methods

- `addEvent(event)` - Add event to scheduler
- `removeEvent(id)` - Remove event by ID
- `scrollToDate(date)` - Navigate to date
- `scrollToResource(id)` - Scroll resource into view

## Events

- `event-create` -> `{ event: SchedulerEvent }`
- `event-move` -> `{ event, oldResourceId, oldStart, oldEnd }`
- `event-resize` -> `{ event, oldStart, oldEnd }`
- `event-click` -> `{ event: SchedulerEvent }`
- `slot-click` -> `{ resourceId, start: Date, end: Date }`

## Usage

```html
<snice-scheduler start-hour="8" end-hour="18" granularity="30"></snice-scheduler>

<script>
scheduler.resources = [
  { id: '1', name: 'Dr. Smith', color: '#2196f3' },
  { id: '2', name: 'Room A', color: '#ff9800' },
];

scheduler.events = [
  { id: '1', resourceId: '1', start: new Date(2025,5,15,9,0), end: new Date(2025,5,15,10,30), title: 'Consultation' },
];

scheduler.addEventListener('event-click', e => console.log(e.detail.event));
scheduler.addEventListener('slot-click', e => console.log(e.detail.resourceId, e.detail.start));
</script>
```

**CSS Parts:**
- `base` - Main container
- `header` - Navigation header
- `resources` - Resource sidebar
- `grid` - Time grid area

## Features

- Day/week/month view toggle
- Drag to move events between resources
- Resize events via edge handles
- Click empty slots to create
- Current time indicator
- Resource avatars with colors
- Auto-navigation with prev/next/today

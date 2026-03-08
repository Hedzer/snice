# snice-scheduler

Multi-resource week/day/month scheduler with drag-to-create, move, and resize events.

## Properties

```typescript
resources: SchedulerResource[] = []      // Resource list (JS only)
events: SchedulerEvent[] = []            // Event list (JS only)
view: SchedulerView = 'week'             // 'day' | 'week' | 'month'
date: Date | string = new Date()         // Current date
granularity: number = 60                 // Slot size in minutes (15, 30, 60)
startHour: number = 0                    // attribute: start-hour
endHour: number = 24                     // attribute: end-hour
```

## Types

```typescript
interface SchedulerResource {
  id: string | number;
  name: string;
  avatar?: string;    // Avatar image URL
  color?: string;     // Accent color
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

- `addEvent(event: SchedulerEvent)` - Add event
- `removeEvent(id: string | number)` - Remove event by ID
- `scrollToDate(date: Date | string)` - Navigate to date
- `scrollToResource(id: string | number)` - Scroll resource into view
- `navigatePrev()` - Go to previous period
- `navigateNext()` - Go to next period
- `navigateToday()` - Go to today

## Events

- `event-create` → `{ event: SchedulerEvent }` - Drag-created event
- `event-move` → `{ event: SchedulerEvent; oldResourceId: string | number; oldStart: Date | string; oldEnd: Date | string }`
- `event-resize` → `{ event: SchedulerEvent; oldStart: Date | string; oldEnd: Date | string }`
- `event-click` → `{ event: SchedulerEvent }`
- `slot-click` → `{ resourceId: string | number; start: Date; end: Date }`

## Slots

None

## Usage

```html
<snice-scheduler start-hour="8" end-hour="18" granularity="30"></snice-scheduler>
```

```typescript
scheduler.resources = [
  { id: '1', name: 'Dr. Smith', color: '#2196f3' },
  { id: '2', name: 'Room A', color: '#ff9800' },
];
scheduler.events = [
  { id: '1', resourceId: '1', start: new Date(2025,5,15,9,0), end: new Date(2025,5,15,10,30), title: 'Consultation' },
];

scheduler.addEventListener('event-click', e => console.log(e.detail.event));
scheduler.addEventListener('slot-click', e => console.log(e.detail.resourceId, e.detail.start));
```

## Features

- Day/week/month view toggle
- Resource sidebar with avatars and colors
- Drag to move events between resources
- Resize events via edge handles
- Click empty slots to trigger slot-click
- Drag on grid to create events
- Current time indicator
- Today/prev/next navigation

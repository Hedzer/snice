# snice-scheduler

Multi-resource week/day/month scheduler with drag-to-create, move, and resize events.

## Properties

```typescript
resources: SchedulerResource[] = [];    // JS only
events: SchedulerEvent[] = [];          // JS only
view: 'day'|'week'|'month' = 'week';
date: Date | string = new Date();
granularity: number = 60;               // Slot size in minutes (15, 30, 60)
startHour: number = 0;                  // attr: start-hour
endHour: number = 24;                   // attr: end-hour
```

## Types

```typescript
interface SchedulerResource {
  id: string | number; name: string; avatar?: string; color?: string;
}
interface SchedulerEvent {
  id: string | number; resourceId: string | number;
  start: Date | string; end: Date | string;
  title: string; color?: string; data?: any;
}
```

## Methods

- `addEvent(event: SchedulerEvent)` - Add event
- `removeEvent(id: string | number)` - Remove event by ID
- `scrollToDate(date: Date | string)` - Navigate to date
- `scrollToResource(id: string | number)` - Scroll resource into view

## Events

- `event-create` → `{ event: SchedulerEvent }`
- `event-move` → `{ event, oldResourceId, oldStart, oldEnd }`
- `event-resize` → `{ event, oldStart, oldEnd }`
- `event-click` → `{ event: SchedulerEvent }`
- `slot-click` → `{ resourceId, start: Date, end: Date }`

## CSS Parts

- `base` - Main container
- `header` - Navigation header with view toggle
- `resources` - Resource sidebar
- `grid` - Time grid area

## Basic Usage

```html
<snice-scheduler start-hour="8" end-hour="18" granularity="30"></snice-scheduler>
```

```typescript
scheduler.resources = [
  { id: '1', name: 'Dr. Smith', color: '#2196f3' },
  { id: '2', name: 'Room A', color: '#ff9800' }
];
scheduler.events = [
  { id: '1', resourceId: '1', start: new Date(2025,5,15,9,0), end: new Date(2025,5,15,10,30), title: 'Consultation' }
];

scheduler.addEventListener('slot-click', e => {
  scheduler.addEvent({ id: Date.now(), resourceId: e.detail.resourceId, start: e.detail.start, end: e.detail.end, title: 'New' });
});
```

## Accessibility

- Keyboard navigation with arrow keys
- ARIA labels on resources and time slots
- Current time indicator

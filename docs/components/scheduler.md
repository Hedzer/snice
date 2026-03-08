<!-- AI: For a low-token version of this doc, use docs/ai/components/scheduler.md instead -->

# Scheduler Component
`<snice-scheduler>`

A multi-resource week/day/month scheduler for managing events across people, rooms, or equipment.

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/scheduler/snice-scheduler';
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-scheduler.min.js"></script>
```

## Properties

| Property | Attribute | Type | Default | Description |
|----------|-----------|------|---------|-------------|
| `resources` | — | `SchedulerResource[]` | `[]` | Array of resources (rows) |
| `events` | — | `SchedulerEvent[]` | `[]` | Array of events on the grid |
| `view` | `view` | `'day' \| 'week' \| 'month'` | `'week'` | Current view mode |
| `date` | `date` | `Date \| string` | `new Date()` | Current view date |
| `granularity` | `granularity` | `number` | `60` | Slot size in minutes (15, 30, 60) |
| `startHour` | `start-hour` | `number` | `0` | First hour displayed |
| `endHour` | `end-hour` | `number` | `24` | Last hour displayed |

## Methods

### `addEvent(event: SchedulerEvent): void`
Add a new event to the scheduler.

```typescript
scheduler.addEvent({
  id: 'new-1',
  resourceId: '1',
  start: new Date(2025, 5, 15, 14, 0),
  end: new Date(2025, 5, 15, 15, 0),
  title: 'New Appointment'
});
```

### `removeEvent(id: string | number): void`
Remove an event by its ID.

```typescript
scheduler.removeEvent('1');
```

### `scrollToDate(date: Date | string): void`
Navigate the scheduler to a specific date.

```typescript
scheduler.scrollToDate(new Date(2025, 5, 20));
```

### `scrollToResource(id: string | number): void`
Scroll a resource row into view.

```typescript
scheduler.scrollToResource('3');
```

## Events

### `event-create`
Dispatched when a new event is created by dragging on an empty slot.

```typescript
scheduler.addEventListener('event-create', (e) => {
  console.log('New event:', e.detail.event);
});
```

**Detail:** `{ event: SchedulerEvent }`

### `event-move`
Dispatched when an event is dragged to a new position or resource.

```typescript
scheduler.addEventListener('event-move', (e) => {
  console.log('Moved:', e.detail.event.title);
  console.log('From resource:', e.detail.oldResourceId);
  console.log('Old time:', e.detail.oldStart, '-', e.detail.oldEnd);
});
```

**Detail:** `{ event: SchedulerEvent, oldResourceId: string | number, oldStart: Date | string, oldEnd: Date | string }`

### `event-resize`
Dispatched when an event is resized via edge handles.

```typescript
scheduler.addEventListener('event-resize', (e) => {
  console.log('Resized:', e.detail.event.title);
});
```

**Detail:** `{ event: SchedulerEvent, oldStart: Date | string, oldEnd: Date | string }`

### `event-click`
Dispatched when an event is clicked.

```typescript
scheduler.addEventListener('event-click', (e) => {
  showEventDetails(e.detail.event);
});
```

**Detail:** `{ event: SchedulerEvent }`

### `slot-click`
Dispatched when an empty time slot is clicked.

```typescript
scheduler.addEventListener('slot-click', (e) => {
  console.log('Resource:', e.detail.resourceId);
  console.log('Time:', e.detail.start, '-', e.detail.end);
});
```

**Detail:** `{ resourceId: string | number, start: Date, end: Date }`

## CSS Parts

| Part | Element | Description |
|------|---------|-------------|
| `base` | `<div>` | Main scheduler container |
| `header` | `<div>` | Navigation header with view toggle |
| `resources` | `<div>` | Resource sidebar |
| `grid` | `<div>` | Time grid area |

```css
snice-scheduler::part(base) {
  border-radius: 12px;
}

snice-scheduler::part(header) {
  background: #f5f5f5;
}
```

## Basic Usage

```html
<snice-scheduler></snice-scheduler>
```

```typescript
scheduler.resources = [
  { id: '1', name: 'Dr. Smith', color: '#2196f3' },
  { id: '2', name: 'Room A', color: '#ff9800' },
];

scheduler.events = [
  {
    id: '1',
    resourceId: '1',
    start: new Date(2025, 5, 15, 9, 0),
    end: new Date(2025, 5, 15, 10, 30),
    title: 'Patient Consultation'
  },
];
```

## Examples

### Week View with Resources

```typescript
scheduler.resources = [
  { id: '1', name: 'Dr. Smith', avatar: '/avatars/smith.jpg', color: '#2196f3' },
  { id: '2', name: 'Dr. Johnson', color: '#4caf50' },
  { id: '3', name: 'Conference Room', color: '#ff9800' },
];
```

### Business Hours Only

```html
<snice-scheduler start-hour="9" end-hour="17" granularity="30"></snice-scheduler>
```

### Day View with 15-Minute Slots

```html
<snice-scheduler view="day" granularity="15" start-hour="8" end-hour="20"></snice-scheduler>
```

### Handling Event Interactions

```typescript
// Create new events from empty slots
scheduler.addEventListener('slot-click', (e) => {
  const newEvent = {
    id: `evt-${Date.now()}`,
    resourceId: e.detail.resourceId,
    start: e.detail.start,
    end: e.detail.end,
    title: 'New Appointment',
    color: '#2196f3'
  };
  scheduler.addEvent(newEvent);
});

// Handle event moves
scheduler.addEventListener('event-move', (e) => {
  saveEventToBackend(e.detail.event);
});

// Handle event resizes
scheduler.addEventListener('event-resize', (e) => {
  saveEventToBackend(e.detail.event);
});
```

### Navigate Programmatically

```typescript
// Go to today
scheduler.date = new Date();

// Switch views
scheduler.view = 'day';
scheduler.view = 'week';
scheduler.view = 'month';
```

## Interfaces

### SchedulerResource

```typescript
interface SchedulerResource {
  id: string | number;
  name: string;
  avatar?: string;  // URL for avatar image
  color?: string;   // Color for avatar fallback
}
```

### SchedulerEvent

```typescript
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

## Accessibility

- Keyboard navigation with arrow keys
- ARIA labels for resources and time slots
- Focus management for events
- Screen reader support

## Browser Support

- Modern browsers with Custom Elements v1 support
- Mouse and touch interaction for drag operations

<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/scheduler.md -->

# Scheduler

A multi-resource week/day/month scheduler for managing events across people, rooms, or equipment. Supports drag-to-create, move, and resize events.

## Table of Contents

- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Accessibility](#accessibility)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `resources` | `SchedulerResource[]` | `[]` | Array of resources/rows (JS only) |
| `events` | `SchedulerEvent[]` | `[]` | Array of events on the grid (JS only) |
| `view` | `'day' \| 'week' \| 'month'` | `'week'` | Current view mode |
| `date` | `Date \| string` | `new Date()` | Current view date |
| `granularity` | `number` | `60` | Slot size in minutes (15, 30, 60) |
| `startHour` (attr: `start-hour`) | `number` | `0` | First hour displayed |
| `endHour` (attr: `end-hour`) | `number` | `24` | Last hour displayed |

### Type Interfaces

```typescript
interface SchedulerResource {
  id: string | number;
  name: string;
  avatar?: string;  // Avatar image URL
  color?: string;   // Accent color
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

| Method | Arguments | Description |
|--------|-----------|-------------|
| `addEvent()` | `event: SchedulerEvent` | Add a new event to the scheduler |
| `removeEvent()` | `id: string \| number` | Remove an event by its ID |
| `scrollToDate()` | `date: Date \| string` | Navigate to a specific date |
| `scrollToResource()` | `id: string \| number` | Scroll a resource row into view |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `event-create` | `{ event: SchedulerEvent }` | New event created by dragging on empty slot |
| `event-move` | `{ event, oldResourceId, oldStart, oldEnd }` | Event dragged to new position/resource |
| `event-resize` | `{ event, oldStart, oldEnd }` | Event resized via edge handles |
| `event-click` | `{ event: SchedulerEvent }` | Event clicked |
| `slot-click` | `{ resourceId, start: Date, end: Date }` | Empty time slot clicked |

## CSS Parts

| Part | Description |
|------|-------------|
| `base` | Main scheduler container |
| `header` | Navigation header with view toggle |
| `resources` | Resource sidebar |
| `grid` | Time grid area |

## Basic Usage

```typescript
import 'snice/components/scheduler/snice-scheduler';
```

```html
<snice-scheduler start-hour="8" end-hour="18" granularity="30"></snice-scheduler>
```

```typescript
scheduler.resources = [
  { id: '1', name: 'Dr. Smith', color: '#2196f3' },
  { id: '2', name: 'Room A', color: '#ff9800' }
];

scheduler.events = [
  {
    id: '1',
    resourceId: '1',
    start: new Date(2025, 5, 15, 9, 0),
    end: new Date(2025, 5, 15, 10, 30),
    title: 'Patient Consultation'
  }
];
```

## Examples

### Business Hours Only

Use `start-hour` and `end-hour` to limit the displayed time range.

```html
<snice-scheduler start-hour="9" end-hour="17" granularity="30"></snice-scheduler>
```

### Day View with 15-Minute Slots

Use `view="day"` and `granularity="15"` for fine-grained scheduling.

```html
<snice-scheduler view="day" granularity="15" start-hour="8" end-hour="20"></snice-scheduler>
```

### Creating Events from Slot Clicks

Listen for `slot-click` to create new events when empty slots are clicked.

```typescript
scheduler.addEventListener('slot-click', (e) => {
  scheduler.addEvent({
    id: `evt-${Date.now()}`,
    resourceId: e.detail.resourceId,
    start: e.detail.start,
    end: e.detail.end,
    title: 'New Appointment',
    color: '#2196f3'
  });
});
```

### Handling Moves and Resizes

Listen for `event-move` and `event-resize` to persist changes.

```typescript
scheduler.addEventListener('event-move', (e) => {
  saveEventToBackend(e.detail.event);
});

scheduler.addEventListener('event-resize', (e) => {
  saveEventToBackend(e.detail.event);
});
```

### Programmatic Navigation

Change the view date and mode programmatically.

```typescript
scheduler.date = new Date();
scheduler.view = 'day';
```

## Accessibility

- Keyboard navigation with arrow keys
- ARIA labels for resources and time slots
- Focus management for events
- Current time indicator in the grid

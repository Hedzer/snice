<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/availability.md -->

# Availability
`<snice-availability>`

A weekly availability grid for setting recurring time ranges. Users can click or drag to toggle time slots on and off.

## Table of Contents
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Accessibility](#accessibility)

## Properties

| Property | Attribute | Type | Default | Description |
|----------|-----------|------|---------|-------------|
| `value` | -- | `AvailabilityRange[]` | `[]` | Current availability ranges (set via JavaScript) |
| `granularity` | `granularity` | `number` | `60` | Slot size in minutes (15, 30, 60) |
| `startHour` | `start-hour` | `number` | `0` | First hour displayed |
| `endHour` | `end-hour` | `number` | `24` | Last hour displayed |
| `format` | `format` | `'12h' \| '24h'` | `'12h'` | Time format for labels |
| `readonly` | `readonly` | `boolean` | `false` | Prevents editing |

### AvailabilityRange Interface

```typescript
interface AvailabilityRange {
  day: number;    // 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun
  start: string;  // "HH:MM" (24h format)
  end: string;    // "HH:MM" (24h format)
}
```

## Methods

### `getAvailability(): AvailabilityRange[]`
Get the current availability ranges.

```javascript
const ranges = availability.getAvailability();
ranges.forEach(r => {
  console.log(`Day ${r.day}: ${r.start} - ${r.end}`);
});
```

### `setAvailability(ranges: AvailabilityRange[]): void`
Set availability ranges programmatically.

```javascript
availability.setAvailability([
  { day: 0, start: '09:00', end: '17:00' },
  { day: 1, start: '09:00', end: '17:00' },
  { day: 2, start: '09:00', end: '17:00' },
  { day: 3, start: '09:00', end: '17:00' },
  { day: 4, start: '09:00', end: '17:00' },
]);
```

### `clear(): void`
Remove all availability.

```javascript
availability.clear();
```

## Events

### `availability-change`
Dispatched when availability changes (after mouse up from drag, or preset/clear action).

**Detail:** `{ value: AvailabilityRange[] }`

```javascript
availability.addEventListener('availability-change', (e) => {
  saveToServer(e.detail.value);
});
```

## CSS Parts

| Part | Element | Description |
|------|---------|-------------|
| `base` | `<div>` | Main container |
| `header` | `<div>` | Header with title and presets |
| `grid` | `<div>` | The availability grid |

```css
snice-availability::part(base) {
  max-width: 800px;
}

snice-availability::part(header) {
  background: #f5f5f5;
}
```

## Basic Usage

```typescript
import 'snice/components/availability/snice-availability';
```

```html
<snice-availability start-hour="8" end-hour="18"></snice-availability>
```

```typescript
availability.addEventListener('availability-change', (e) => {
  console.log('Availability:', e.detail.value);
});
```

## Examples

### Business Hours Setup

```html
<snice-availability start-hour="8" end-hour="18"></snice-availability>
```

### 30-Minute Granularity

Use the `granularity` attribute to change slot size.

```html
<snice-availability granularity="30" start-hour="6" end-hour="22"></snice-availability>
```

### 24-Hour Format

Use the `format` attribute to switch time labels.

```html
<snice-availability format="24h"></snice-availability>
```

### Pre-filled Availability

```javascript
availability.value = [
  { day: 0, start: '09:00', end: '12:00' },
  { day: 0, start: '13:00', end: '17:00' },
  { day: 1, start: '09:00', end: '17:00' },
  { day: 2, start: '10:00', end: '16:00' },
  { day: 3, start: '09:00', end: '17:00' },
  { day: 4, start: '09:00', end: '15:00' },
];
```

### Readonly Display

Display availability without allowing edits. Presets are hidden.

```html
<snice-availability readonly></snice-availability>
```

### Presets

The component includes built-in preset buttons:

- **Business Hours** - Mon-Fri, 9 AM - 5 PM
- **Weekdays Only** - Mon-Fri, all hours
- **Clear All** - Remove all availability

### Programmatic Control

```javascript
// Set specific availability
availability.setAvailability([
  { day: 0, start: '09:00', end: '17:00' },
  { day: 2, start: '10:00', end: '14:00' },
]);

// Read current state
const ranges = availability.getAvailability();

// Clear all
availability.clear();
```

### Saving to Backend

```javascript
availability.addEventListener('availability-change', async (e) => {
  const ranges = e.detail.value;
  await fetch('/api/availability', {
    method: 'PUT',
    body: JSON.stringify({ availability: ranges }),
    headers: { 'Content-Type': 'application/json' },
  });
});
```

### Meeting Scheduler Integration

```javascript
// Load team member's availability
const data = await fetch(`/api/users/${userId}/availability`);
const ranges = await data.json();

availability.setAvailability(ranges);
availability.readonly = true; // Display only
```

## Accessibility

- **Interaction**: Click a cell to toggle, click and drag to paint multiple cells
- **Visual legend**: Available/unavailable indicator in footer
- **Hours counter**: Total selected hours displayed in footer

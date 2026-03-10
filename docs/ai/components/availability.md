# snice-availability

Weekly availability grid. 7 columns (Mon-Sun), rows = time slots. Toggle cells by click or drag.

## Properties

```typescript
value: AvailabilityRange[] = [];
granularity: number = 60;       // slot size in minutes (15, 30, 60)
startHour: number = 0;          // attr: start-hour
endHour: number = 24;           // attr: end-hour
format: '12h'|'24h' = '12h';
readonly: boolean = false;

interface AvailabilityRange {
  day: number;    // 0=Mon, 1=Tue, ..., 6=Sun
  start: string;  // "HH:MM"
  end: string;    // "HH:MM"
}
```

## Methods

- `getAvailability()` - Returns `AvailabilityRange[]`
- `setAvailability(ranges)` - Set availability ranges
- `clear()` - Remove all availability

## Events

- `availability-change` → `{ value: AvailabilityRange[] }`

## CSS Parts

- `base` - Main container
- `header` - Header with title and presets
- `grid` - Availability grid

## Basic Usage

```html
<snice-availability start-hour="8" end-hour="18" granularity="30"></snice-availability>
<snice-availability format="24h"></snice-availability>
<snice-availability readonly></snice-availability>
```

```typescript
availability.setAvailability([
  { day: 0, start: '09:00', end: '17:00' },
  { day: 1, start: '09:00', end: '17:00' },
]);
availability.addEventListener('availability-change', e => console.log(e.detail.value));
const ranges = availability.getAvailability();
availability.clear();
```

## Accessibility

- Click or drag to toggle cells
- Presets: Business Hours, Weekdays Only, Clear All
- Visual legend and total hours counter

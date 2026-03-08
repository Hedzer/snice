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
```

## Interfaces

```typescript
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

- `availability-change` -> `{ value: AvailabilityRange[] }`

## Usage

```html
<snice-availability start-hour="8" end-hour="18" granularity="30"></snice-availability>
```

```typescript
// Pre-fill
availability.setAvailability([
  { day: 0, start: '09:00', end: '17:00' },
  { day: 1, start: '09:00', end: '17:00' },
]);

// Listen for changes
availability.addEventListener('availability-change', e => {
  console.log(e.detail.value);
});

// Read current state
const ranges = availability.getAvailability();

// Clear all
availability.clear();

<!-- Readonly display -->
<snice-availability readonly></snice-availability>

<!-- 24h format -->
<snice-availability format="24h"></snice-availability>
```

**CSS Parts:**
- `base` - Main container
- `header` - Header with title and presets
- `grid` - Availability grid

## Features

- Click or drag to toggle cells
- Presets: Business Hours, Weekdays Only, Clear All
- Readonly mode
- 12h/24h time format
- Configurable granularity (15/30/60 min)
- Configurable hour range
- Legend and total hours counter
- Drag painting (add/remove mode)

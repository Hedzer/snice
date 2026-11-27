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
- `title` - Header title text
- `presets` - Preset button row
- `preset` - A preset button
- `preset-business` - Added to `preset` on the Business Hours button
- `preset-weekdays` - Added to `preset` on the Weekdays Only button
- `preset-clear` - Added to `preset` on the Clear All button
- `grid-wrapper` - Scroll wrapper around the grid
- `grid` - Availability grid
- `row` - A grid row
- `row-header` - Added to `row` on the day-name header row
- `corner` - Empty corner cell above the time column
- `day-header` - A day-name column header
- `time-label` - A time-column label
- `time-label-hour` - Added to `time-label` on hour boundaries
- `time-label-sub-hour` - Added to `time-label` between hour boundaries
- `cell` - A selectable slot cell
- `cell-hour-start` - Added to `cell` on hour boundaries
- `cell-sub-hour` - Added to `cell` between hour boundaries
- `cell-active` - Added to `cell` while the slot is selected
- `footer` - Footer with legend and count
- `legend` - Legend container
- `legend-item` - A legend entry
- `legend-swatch` - A legend color swatch
- `legend-swatch-available` - Added to `legend-swatch` on the available swatch
- `legend-swatch-unavailable` - Added to `legend-swatch` on the unavailable swatch
- `count` - Selected-hours summary text

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

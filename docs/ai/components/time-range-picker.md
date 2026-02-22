# snice-time-range-picker

Vertically stacked time slot picker with click-and-drag range selection.

## Properties

```typescript
granularity: 5 | 15 | 30 | 60 = 15;       // Slot interval in minutes
startTime: string = '00:00';               // Day start (attribute: start-time)
endTime: string = '23:59';                 // Day end (attribute: end-time)
value: string = '';                        // JSON array of TimeRange[]
disabledRanges: string = '';               // JSON array of TimeRange[] (attribute: disabled-ranges)
format: '12h' | '24h' = '24h';            // Time display format
multiple: boolean = false;                 // Allow multiple non-contiguous ranges
readonly: boolean = false;
disabled: boolean = false;
```

## Types

```typescript
interface TimeRange { start: string; end: string; }
```

## Methods

- `getSelectedRanges(): TimeRange[]` - Get current selections
- `setSelectedRanges(ranges: TimeRange[]): void` - Set selections programmatically
- `clearSelection(): void` - Clear all selections
- `isSlotDisabled(time: string): boolean` - Check if time slot is disabled

## Events

- `@snice/time-range-change` - `{ranges: TimeRange[], component}`
- `@snice/time-range-select` - `{start: string, component}` - Drag begins
- `@snice/time-range-complete` - `{range: TimeRange, ranges: TimeRange[], component}` - Drag ends

## Usage

```html
<!-- Basic -->
<snice-time-range-picker start-time="08:00" end-time="18:00"></snice-time-range-picker>

<!-- 12h format, 30min granularity -->
<snice-time-range-picker granularity="30" format="12h"></snice-time-range-picker>

<!-- With disabled ranges -->
<snice-time-range-picker
  disabled-ranges='[{"start":"12:00","end":"13:00"}]'>
</snice-time-range-picker>

<!-- Pre-selected value -->
<snice-time-range-picker
  value='[{"start":"09:00","end":"11:00"}]'>
</snice-time-range-picker>

<!-- Multiple selection -->
<snice-time-range-picker multiple></snice-time-range-picker>

<!-- Event handling -->
<script>
picker.addEventListener('@snice/time-range-change', (e) => {
  console.log(e.detail.ranges);
});
</script>
```

## Features

- Click and drag to select time ranges
- Single click for individual slot
- Keyboard navigation (Enter/Space to select, arrows to navigate, Escape to clear)
- Configurable granularity (5/15/30/60 min)
- 12h/24h time format
- Disabled time slots
- Multiple selection mode
- Touch support
- ARIA attributes for accessibility

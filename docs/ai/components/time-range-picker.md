# snice-time-range-picker

Vertically stacked time slot picker with click-and-drag range selection.

## Properties

```typescript
granularity: 5|15|30|60 = 15;
startTime: string = '00:00';     // attr: start-time
endTime: string = '23:59';       // attr: end-time
value: string = '';              // JSON array of TimeRange[]
disabledRanges: string = '';     // attr: disabled-ranges, JSON array of TimeRange[]
format: '12h'|'24h' = '24h';
multiple: boolean = false;
readonly: boolean = false;
disabled: boolean = false;

interface TimeRange { start: string; end: string; }
```

## Methods

- `getSelectedRanges()` - Returns TimeRange[]
- `setSelectedRanges(ranges)` - Set selections programmatically
- `clearSelection()` - Clear all selections
- `isSlotDisabled(time)` - Check if time slot is disabled

## Events

- `time-range-change` -> `{ ranges, component }`
- `time-range-select` -> `{ start, component }` - Drag begins
- `time-range-complete` -> `{ range, ranges, component }` - Drag ends

## CSS Parts

- `base` - The outer wrapper container
- `header` - The header with label and selected value display
- `slots` - The time slots container

## Basic Usage

```html
<snice-time-range-picker start-time="08:00" end-time="18:00"></snice-time-range-picker>
<snice-time-range-picker granularity="30" format="12h" multiple></snice-time-range-picker>
<snice-time-range-picker disabled-ranges='[{"start":"12:00","end":"13:00"}]'></snice-time-range-picker>
<snice-time-range-picker value='[{"start":"09:00","end":"11:00"}]'></snice-time-range-picker>
```

```typescript
picker.setSelectedRanges([{ start: '09:00', end: '11:00' }]);
const ranges = picker.getSelectedRanges();
picker.clearSelection();
```

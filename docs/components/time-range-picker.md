# Time Range Picker

The `<snice-time-range-picker>` component provides a vertically stacked time slot picker for selecting time ranges within a single day. Users can click and drag to select contiguous time ranges, or click individual slots.

## Basic Usage

```html
<snice-time-range-picker
  start-time="08:00"
  end-time="18:00">
</snice-time-range-picker>
```

## Properties

| Property | Attribute | Type | Default | Description |
|----------|-----------|------|---------|-------------|
| `granularity` | `granularity` | `5 \| 15 \| 30 \| 60` | `15` | Time interval in minutes for each slot |
| `startTime` | `start-time` | `string` | `'00:00'` | Start time of the day in HH:MM format |
| `endTime` | `end-time` | `string` | `'23:59'` | End time of the day in HH:MM format |
| `value` | `value` | `string` | `''` | JSON string of selected time ranges |
| `disabledRanges` | `disabled-ranges` | `string` | `''` | JSON string of disabled time ranges |
| `format` | `format` | `'12h' \| '24h'` | `'24h'` | Time display format |
| `multiple` | `multiple` | `boolean` | `false` | Allow multiple non-contiguous range selections |
| `readonly` | `readonly` | `boolean` | `false` | Prevent interaction but show selections |
| `disabled` | `disabled` | `boolean` | `false` | Disable all interaction |

## Time Range Format

Both `value` and `disabled-ranges` use JSON arrays of time range objects:

```typescript
interface TimeRange {
  start: string;  // "HH:MM" format
  end: string;    // "HH:MM" format
}
```

Example:
```json
[{"start": "09:00", "end": "11:00"}, {"start": "14:00", "end": "16:00"}]
```

## Events

### `@snice/time-range-change`

Fired when the selection changes.

```javascript
picker.addEventListener('@snice/time-range-change', (e) => {
  console.log('Selected ranges:', e.detail.ranges);
  // [{start: "09:00", end: "10:30"}, ...]
});
```

**Detail:**
- `ranges` - Array of selected `TimeRange` objects
- `component` - Reference to the picker element

### `@snice/time-range-select`

Fired when a drag selection begins.

```javascript
picker.addEventListener('@snice/time-range-select', (e) => {
  console.log('Drag started at:', e.detail.start);
});
```

**Detail:**
- `start` - The time where dragging started
- `component` - Reference to the picker element

### `@snice/time-range-complete`

Fired when a drag selection completes.

```javascript
picker.addEventListener('@snice/time-range-complete', (e) => {
  console.log('Completed range:', e.detail.range);
  console.log('All ranges:', e.detail.ranges);
});
```

**Detail:**
- `range` - The just-completed `TimeRange`
- `ranges` - All currently selected ranges
- `component` - Reference to the picker element

## Methods

### `getSelectedRanges(): TimeRange[]`

Returns an array of currently selected time ranges.

```javascript
const ranges = picker.getSelectedRanges();
// [{start: "09:00", end: "10:30"}]
```

### `setSelectedRanges(ranges: TimeRange[]): void`

Programmatically sets the selected time ranges.

```javascript
picker.setSelectedRanges([
  { start: '09:00', end: '11:00' },
  { start: '14:00', end: '16:00' }
]);
```

### `clearSelection(): void`

Clears all selected time ranges.

```javascript
picker.clearSelection();
```

### `isSlotDisabled(time: string): boolean`

Checks if a specific time slot is disabled.

```javascript
picker.isSlotDisabled('12:00'); // true if in disabled ranges
```

## Examples

### Appointment Booking

```html
<snice-time-range-picker
  granularity="30"
  format="12h"
  start-time="08:00"
  end-time="18:00"
  disabled-ranges='[{"start":"12:00","end":"13:00"}]'>
</snice-time-range-picker>
```

### Working Hours Configuration

```html
<snice-time-range-picker
  multiple
  granularity="60"
  start-time="06:00"
  end-time="22:00">
</snice-time-range-picker>
```

### Fine-Grained Scheduling

```html
<snice-time-range-picker
  granularity="5"
  start-time="09:00"
  end-time="10:00">
</snice-time-range-picker>
```

### Pre-selected Schedule

```html
<snice-time-range-picker
  granularity="30"
  format="12h"
  start-time="08:00"
  end-time="18:00"
  value='[{"start":"09:00","end":"11:30"},{"start":"14:00","end":"16:30"}]'
  multiple>
</snice-time-range-picker>
```

## Interaction

### Mouse
- **Click** a slot to select it individually
- **Click and drag** across slots to select a contiguous range
- In multiple mode, existing selections are preserved when adding new ranges

### Touch
- **Tap** a slot to select it
- **Touch and drag** to select a range

### Keyboard
- **Enter / Space** - Toggle selection of focused slot
- **Arrow Up / Down** - Navigate between slots
- **Escape** - Clear all selections

## Accessibility

- Each slot has `role="option"` with appropriate `aria-selected` and `aria-disabled` attributes
- Keyboard-navigable with visible focus indicators
- Disabled slots have `tabindex="-1"` and are skipped during keyboard navigation

## Styling

The component uses CSS custom properties from the Snice theme system:

| Variable | Usage |
|----------|-------|
| `--snice-color-primary` | Selected slot background |
| `--snice-color-text-inverse` | Selected slot text |
| `--snice-color-border` | Slot borders |
| `--snice-color-background` | Component background |
| `--snice-color-background-element` | Disabled slot background / hover |
| `--snice-color-text-tertiary` | Disabled slot text |
| `--snice-font-family` | Font family |

All values include fallbacks for use without the theme loaded.

[//]: # (AI: For a low-token version of this doc, use docs/ai/components/time-range-picker.md instead)

# Time Range Picker
`<snice-time-range-picker>`

A vertically stacked time slot picker for selecting time ranges within a single day via click and drag.

## Basic Usage

```typescript
import 'snice/components/time-range-picker/snice-time-range-picker';
```

```html
<snice-time-range-picker start-time="08:00" end-time="18:00"></snice-time-range-picker>
```

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/time-range-picker/snice-time-range-picker';
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-time-range-picker.min.js"></script>
```

## Examples

### Granularity

Use the `granularity` attribute to set the time interval in minutes for each slot.

```html
<snice-time-range-picker granularity="5"></snice-time-range-picker>
<snice-time-range-picker granularity="15"></snice-time-range-picker>
<snice-time-range-picker granularity="30"></snice-time-range-picker>
<snice-time-range-picker granularity="60"></snice-time-range-picker>
```

### 12-Hour Format

Use the `format` attribute to switch between 12-hour and 24-hour time display.

```html
<snice-time-range-picker format="12h" start-time="08:00" end-time="18:00"></snice-time-range-picker>
```

### Multiple Ranges

Set the `multiple` attribute to allow selecting non-contiguous ranges.

```html
<snice-time-range-picker multiple granularity="30" start-time="08:00" end-time="18:00"></snice-time-range-picker>
```

### Disabled Ranges

Use the `disabled-ranges` attribute (JSON string) to block out unavailable time slots.

```html
<snice-time-range-picker
  granularity="30"
  start-time="08:00"
  end-time="18:00"
  disabled-ranges='[{"start":"12:00","end":"13:00"}]'>
</snice-time-range-picker>
```

### Pre-selected Values

Use the `value` attribute (JSON string) to set initial selections.

```html
<snice-time-range-picker
  multiple
  granularity="30"
  start-time="08:00"
  end-time="18:00"
  value='[{"start":"09:00","end":"11:30"},{"start":"14:00","end":"16:30"}]'>
</snice-time-range-picker>
```

### Readonly and Disabled

```html
<snice-time-range-picker readonly value='[{"start":"09:00","end":"12:00"}]'></snice-time-range-picker>
<snice-time-range-picker disabled></snice-time-range-picker>
```

### Event Handling

```javascript
const picker = document.querySelector('snice-time-range-picker');

picker.addEventListener('time-range-change', (e) => {
  console.log('Selected ranges:', e.detail.ranges);
});

picker.addEventListener('time-range-complete', (e) => {
  console.log('Completed range:', e.detail.range);
});
```

### Programmatic Control

```javascript
const picker = document.querySelector('snice-time-range-picker');

picker.setSelectedRanges([
  { start: '09:00', end: '11:00' },
  { start: '14:00', end: '16:00' }
]);

const ranges = picker.getSelectedRanges();
picker.clearSelection();
picker.isSlotDisabled('12:00'); // true if disabled
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `granularity` | `5 \| 15 \| 30 \| 60` | `15` | Time interval per slot (minutes) |
| `startTime` (attr: `start-time`) | `string` | `'00:00'` | Day start time (HH:MM) |
| `endTime` (attr: `end-time`) | `string` | `'23:59'` | Day end time (HH:MM) |
| `value` | `string` | `''` | JSON array of selected ranges |
| `disabledRanges` (attr: `disabled-ranges`) | `string` | `''` | JSON array of disabled ranges |
| `format` | `'12h' \| '24h'` | `'24h'` | Time display format |
| `multiple` | `boolean` | `false` | Allow multiple non-contiguous ranges |
| `readonly` | `boolean` | `false` | Show selections but prevent interaction |
| `disabled` | `boolean` | `false` | Disable all interaction |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `time-range-change` | `{ ranges: TimeRange[], component }` | Selection changed |
| `time-range-select` | `{ start: string, component }` | Drag selection started |
| `time-range-complete` | `{ range: TimeRange, ranges: TimeRange[], component }` | Drag selection completed |

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `getSelectedRanges()` | -- | Returns `TimeRange[]` |
| `setSelectedRanges()` | `ranges: TimeRange[]` | Set selected ranges |
| `clearSelection()` | -- | Clear all selections |
| `isSlotDisabled()` | `time: string` | Check if slot is disabled, returns `boolean` |

### TimeRange Interface

```typescript
interface TimeRange {
  start: string;  // "HH:MM"
  end: string;    // "HH:MM"
}
```

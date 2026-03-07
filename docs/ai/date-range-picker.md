# Date Range Picker

`<snice-date-range-picker>` — date range selection with calendar, presets, year picker.

## Properties

| Property | Type | Default | Attribute |
|----------|------|---------|-----------|
| `start` | `string` | `''` | `start` |
| `end` | `string` | `''` | `end` |
| `size` | `'small'\|'medium'\|'large'` | `'medium'` | `size` |
| `variant` | `'outlined'\|'filled'\|'underlined'` | `'outlined'` | `variant` |
| `format` | `DateRangeFormat` | `'mm/dd/yyyy'` | `format` |
| `placeholder` | `string` | `''` | `placeholder` |
| `label` | `string` | `''` | `label` |
| `helperText` | `string` | `''` | `helper-text` |
| `errorText` | `string` | `''` | `error-text` |
| `disabled` | `boolean` | `false` | `disabled` |
| `readonly` | `boolean` | `false` | `readonly` |
| `loading` | `boolean` | `false` | `loading` |
| `required` | `boolean` | `false` | `required` |
| `invalid` | `boolean` | `false` | `invalid` |
| `clearable` | `boolean` | `false` | `clearable` |
| `min` | `string` | `''` | `min` |
| `max` | `string` | `''` | `max` |
| `name` | `string` | `''` | `name` |
| `columns` | `number` | `1` | `columns` |
| `firstDayOfWeek` | `number` | `0` | `first-day-of-week` |
| `presets` | `DateRangePreset[]` | `[]` | N/A (`attribute: false`) |
| `showCalendar` | `boolean` | `false` | `show-calendar` |

## Formats

`'mm/dd/yyyy'` | `'dd/mm/yyyy'` | `'yyyy-mm-dd'` | `'yyyy/mm/dd'` | `'dd-mm-yyyy'` | `'mm-dd-yyyy'` | `'mmmm dd, yyyy'`

## Events

| Event | Detail |
|-------|--------|
| `daterange-change` | `{ start, end, startDate, endDate, startIso, endIso }` |
| `daterange-open` | `{ dateRangePicker }` |
| `daterange-close` | `{ dateRangePicker }` |
| `daterange-clear` | `{ dateRangePicker }` |
| `daterange-preset` | `{ label, start, end }` |

## Methods

- `open()` / `close()` — toggle calendar
- `clear()` — clear both dates
- `focus()` / `blur()` — focus input
- `selectRange(start: Date, end: Date)` — programmatic selection
- `checkValidity()` / `reportValidity()` / `setCustomValidity(msg)`

## Presets

```js
picker.presets = [
  { label: 'Last 7 days', start: new Date(Date.now() - 7*86400000), end: new Date() },
  { label: 'This month', start: new Date(2026, 2, 1), end: new Date(2026, 2, 31) },
];
```

## Form Integration

`formAssociated: true`. Submits `{name}-start` and `{name}-end` via FormData.

## CSS Parts

`input`, `calendar-toggle`, `clear`, `spinner`, `calendar`, `error-text`, `helper-text`

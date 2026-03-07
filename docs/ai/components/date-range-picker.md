# snice-date-range-picker

Date range selection with calendar, presets, year picker. Form-associated.

## Properties

```typescript
start: string = '';
end: string = '';
size: 'small'|'medium'|'large' = 'medium';
variant: 'outlined'|'filled'|'underlined' = 'outlined';
format: DateRangeFormat = 'mm/dd/yyyy';
placeholder: string = '';
label: string = '';
helperText: string = '';           // attr: helper-text
errorText: string = '';            // attr: error-text
disabled: boolean = false;
readonly: boolean = false;
loading: boolean = false;
required: boolean = false;
invalid: boolean = false;
clearable: boolean = false;
min: string = '';
max: string = '';
name: string = '';
columns: number = 1;
firstDayOfWeek: number = 0;       // attr: first-day-of-week
presets: DateRangePreset[] = [];   // attribute: false (JS only)
showCalendar: boolean = false;     // attr: show-calendar
```

## Formats

`'mm/dd/yyyy'` | `'dd/mm/yyyy'` | `'yyyy-mm-dd'` | `'yyyy/mm/dd'` | `'dd-mm-yyyy'` | `'mm-dd-yyyy'` | `'mmmm dd, yyyy'`

## Events

- `daterange-change` → `{ start, end, startDate, endDate, startIso, endIso }`
- `daterange-open` → `{ dateRangePicker }`
- `daterange-close` → `{ dateRangePicker }`
- `daterange-clear` → `{ dateRangePicker }`
- `daterange-preset` → `{ label, start, end }`

## Methods

- `open()` / `close()` - Toggle calendar
- `clear()` - Clear both dates
- `focus()` / `blur()` - Focus input
- `selectRange(start: Date, end: Date)` - Programmatic selection
- `checkValidity()` - Check validation, returns `boolean`
- `reportValidity()` - Report validation to user, returns `boolean`
- `setCustomValidity(message)` - Set custom validation message

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

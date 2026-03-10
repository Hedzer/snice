# snice-date-time-picker

Combined date and time picker. Calendar for date, scrollable columns for time. Form-associated.

## Properties

```typescript
value: string = '';                                   // ISO datetime (YYYY-MM-DDTHH:MM or YYYY-MM-DDTHH:MM:SS)
dateFormat: DateTimePickerDateFormat = 'yyyy-mm-dd';  // attribute: date-format
timeFormat: '12h'|'24h' = '24h';                     // attribute: time-format
size: 'small'|'medium'|'large' = 'medium';
min: string = '';                                     // Min date (YYYY-MM-DD)
max: string = '';                                     // Max date (YYYY-MM-DD)
showSeconds: boolean = false;                         // attribute: show-seconds
disabled: boolean = false;
readonly: boolean = false;
loading: boolean = false;
clearable: boolean = false;
placeholder: string = '';
label: string = '';
helperText: string = '';                              // attribute: helper-text
errorText: string = '';                               // attribute: error-text
required: boolean = false;
invalid: boolean = false;
name: string = '';
variant: 'dropdown'|'inline' = 'dropdown';
```

Date formats: `'yyyy-mm-dd'`|`'mm/dd/yyyy'`|`'dd/mm/yyyy'`|`'yyyy/mm/dd'`|`'dd-mm-yyyy'`|`'mm-dd-yyyy'`|`'mmmm dd, yyyy'`

## Methods

- `open()` - Open panel
- `close()` - Close panel
- `clear()` - Clear value
- `focus()` - Focus input
- `blur()` - Blur input
- `checkValidity()` / `reportValidity()` / `setCustomValidity(msg)`

## Events

- `datetime-change` → `{ value, date, dateString, timeString, iso, dateTimePicker }`
- `datetimepicker-focus` → `{ dateTimePicker }`
- `datetimepicker-blur` → `{ dateTimePicker }`
- `datetimepicker-open` → `{ dateTimePicker }`
- `datetimepicker-close` → `{ dateTimePicker }`
- `datetimepicker-clear` → `{ dateTimePicker }`

## CSS Parts

`base`, `label`, `input`, `toggle`, `panel`, `calendar`, `time`, `clear`, `spinner`, `helper-text`, `error-text`

## Basic Usage

```html
<snice-date-time-picker label="Appointment"></snice-date-time-picker>
<snice-date-time-picker value="2024-12-25T14:30" time-format="12h"></snice-date-time-picker>
<snice-date-time-picker show-seconds value="2024-12-25T14:30:45"></snice-date-time-picker>
<snice-date-time-picker variant="inline" value="2024-06-15T10:00"></snice-date-time-picker>
<snice-date-time-picker min="2024-01-01" max="2024-12-31"></snice-date-time-picker>
```

```typescript
dtp.addEventListener('datetime-change', (e) => {
  console.log('ISO:', e.detail.iso);
  console.log('Date:', e.detail.dateString);
  console.log('Time:', e.detail.timeString);
});
```

## Accessibility

- Form-associated with ElementInternals
- Calendar uses popover="manual"
- Responsive: stacks vertically on mobile (<480px)
- Year picker via calendar header year button

# snice-date-time-picker

Combined date and time picker. Calendar for date, scrollable columns for time.

## Properties

```typescript
value: string = '';                                   // ISO datetime (YYYY-MM-DDTHH:MM or YYYY-MM-DDTHH:MM:SS)
dateFormat: DateTimePickerDateFormat = 'yyyy-mm-dd';   // attribute: date-format — 'yyyy-mm-dd'|'mm/dd/yyyy'|'dd/mm/yyyy'|'yyyy/mm/dd'|'dd-mm-yyyy'|'mm-dd-yyyy'|'mmmm dd, yyyy'
timeFormat: '12h'|'24h' = '24h';                      // attribute: time-format
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

## Methods

- `open()` - Open panel
- `close()` - Close panel
- `clear()` - Clear value
- `focus()` - Focus input
- `blur()` - Blur input
- `checkValidity()` / `reportValidity()` / `setCustomValidity(msg)`

## Events

- `datetime-change` -> `{ value, date, dateString, timeString, iso, dateTimePicker }`
- `datetimepicker-focus` -> `{ dateTimePicker }`
- `datetimepicker-blur` -> `{ dateTimePicker }`
- `datetimepicker-open` -> `{ dateTimePicker }`
- `datetimepicker-close` -> `{ dateTimePicker }`
- `datetimepicker-clear` -> `{ dateTimePicker }`

## Usage

```html
<!-- Basic -->
<snice-date-time-picker label="Appointment"></snice-date-time-picker>

<!-- With value -->
<snice-date-time-picker value="2024-12-25T14:30"></snice-date-time-picker>

<!-- 12h format -->
<snice-date-time-picker time-format="12h" value="2024-12-25T14:30"></snice-date-time-picker>

<!-- With seconds -->
<snice-date-time-picker show-seconds value="2024-12-25T14:30:45"></snice-date-time-picker>

<!-- Date constraints -->
<snice-date-time-picker min="2024-01-01" max="2024-12-31"></snice-date-time-picker>

<!-- Inline (always visible) -->
<snice-date-time-picker variant="inline" value="2024-06-15T10:00"></snice-date-time-picker>

<!-- Event handling -->
<snice-date-time-picker id="dtp"></snice-date-time-picker>
<script>
document.querySelector('#dtp').addEventListener('datetime-change', (e) => {
  console.log('ISO:', e.detail.iso);
  console.log('Date:', e.detail.dateString);
  console.log('Time:', e.detail.timeString);
});
</script>
```

## CSS Parts

`base`, `label`, `input`, `toggle`, `panel`, `calendar`, `time`, `clear`, `spinner`, `helper-text`, `error-text`

## Features

- Form-associated custom element
- Calendar with month navigation + time selector columns side-by-side
- Year picker (click year in header → 12-year grid, navigate ranges, click to select)
- Dropdown or inline variant
- 12h/24h time format with AM/PM toggle
- Optional seconds selector
- 3 sizes (small, medium, large)
- Loading state with spinner
- Clearable with clear button
- Min/max date constraints
- Configurable date display format
- Constraint Validation API (checkValidity, reportValidity, setCustomValidity)
- Responsive: stacks vertically on mobile

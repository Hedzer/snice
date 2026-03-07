# snice-date-picker

Calendar-based date input with format options and validation.

## Properties

```typescript
value: string = '';
format: 'yyyy-mm-dd'|'mm/dd/yyyy'|'dd/mm/yyyy'|'yyyy/mm/dd'|'dd-mm-yyyy'|'mm-dd-yyyy'|'mmmm dd, yyyy' = 'mm/dd/yyyy';
variant: 'outlined'|'filled'|'underlined' = 'outlined';
placeholder: string = '';
disabled: boolean = false;
required: boolean = false;
invalid: boolean = false;
readonly: boolean = false;
clearable: boolean = false;
loading: boolean = false;
min: string = '';              // Min date (ISO format)
max: string = '';              // Max date (ISO format)
size: 'small'|'medium'|'large' = 'medium';
name: string = '';
label: string = '';
helperText: string = '';       // attribute: helper-text
errorText: string = '';        // attribute: error-text
showCalendar: boolean = false; // attribute: show-calendar
firstDayOfWeek: number = 0;    // attribute: first-day-of-week, 0=Sun, 1=Mon, etc.
```

## Methods

- `focus()` - Focus input
- `blur()` - Blur input
- `clear()` - Clear value
- `open()` - Open calendar
- `close()` - Close calendar
- `selectDate(date: Date)` - Programmatically select a date
- `goToMonth(year, month)` - Navigate to specific month
- `goToToday()` - Navigate to and select today
- `checkValidity()` - Check input validity
- `reportValidity()` - Report input validity
- `setCustomValidity(message)` - Set custom validation message

## Events

- `datepicker-input` → {value, datePicker}
- `datepicker-change` → {value, date, formatted, iso, datePicker}
- `datepicker-focus` → {datePicker}
- `datepicker-blur` → {datePicker}
- `datepicker-open` → {datePicker}
- `datepicker-close` → {datePicker}
- `datepicker-clear` → {datePicker}
- `datepicker-select` → {date, formatted, iso, datePicker}

## Usage

```html
<!-- Basic -->
<snice-date-picker label="Select date"></snice-date-picker>

<!-- With format -->
<snice-date-picker format="dd/mm/yyyy"></snice-date-picker>

<!-- With min/max -->
<snice-date-picker min="2024-01-01" max="2024-12-31"></snice-date-picker>

<!-- Clearable -->
<snice-date-picker value="2024-03-15" clearable></snice-date-picker>

<!-- Disabled/readonly -->
<snice-date-picker disabled></snice-date-picker>
<snice-date-picker readonly></snice-date-picker>

<!-- Form integration -->
<snice-date-picker name="birthdate" required></snice-date-picker>

<!-- Event handling -->
<snice-date-picker id="dp"></snice-date-picker>
<script>
document.querySelector('#dp').addEventListener('datepicker-change', (e) => {
  console.log('Date:', e.detail.value);
});
</script>
```

## Features

- Form-associated custom element
- Calendar popup with month/year navigation
- Year picker (click year in header → 12-year grid, navigate ranges, click to select)
- 7 date format options
- Min/max date validation
- Clearable with X button
- 3 sizes, 3 variants
- Keyboard accessible
- Invalid state styling

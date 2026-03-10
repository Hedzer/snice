# snice-date-picker

Calendar-based date input with format options and validation. Form-associated custom element.

## Properties

```typescript
value: string = '';
format: 'yyyy-mm-dd'|'mm/dd/yyyy'|'dd/mm/yyyy'|'yyyy/mm/dd'|'dd-mm-yyyy'|'mm-dd-yyyy'|'mmmm dd, yyyy' = 'mm/dd/yyyy';
variant: 'outlined'|'filled'|'underlined' = 'outlined';
size: 'small'|'medium'|'large' = 'medium';
placeholder: string = '';
label: string = '';
helperText: string = '';       // attribute: helper-text
errorText: string = '';        // attribute: error-text
disabled: boolean = false;
readonly: boolean = false;
loading: boolean = false;
required: boolean = false;
invalid: boolean = false;
clearable: boolean = false;
min: string = '';              // Min date (ISO format)
max: string = '';              // Max date (ISO format)
name: string = '';
showCalendar: boolean = false; // attribute: show-calendar
firstDayOfWeek: number = 0;   // attribute: first-day-of-week, 0=Sun, 1=Mon
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

- `datepicker-input` → `{ value, datePicker }`
- `datepicker-change` → `{ value, date, formatted, iso, datePicker }`
- `datepicker-focus` → `{ datePicker }`
- `datepicker-blur` → `{ datePicker }`
- `datepicker-open` → `{ datePicker }`
- `datepicker-close` → `{ datePicker }`
- `datepicker-clear` → `{ datePicker }`
- `datepicker-select` → `{ date, formatted, iso, datePicker }`

## CSS Parts

- `input` - Text input element
- `calendar-toggle` - Calendar icon button
- `clear` - Clear button
- `spinner` - Loading spinner
- `calendar` - Calendar popup container
- `helper-text` - Helper text element
- `error-text` - Error text element

## Basic Usage

```html
<snice-date-picker label="Select date"></snice-date-picker>
<snice-date-picker format="dd/mm/yyyy" clearable></snice-date-picker>
<snice-date-picker min="2024-01-01" max="2024-12-31"></snice-date-picker>
<snice-date-picker name="birthdate" required></snice-date-picker>
```

```typescript
dp.addEventListener('datepicker-change', (e) => {
  console.log('Date:', e.detail.formatted, 'ISO:', e.detail.iso);
});
```

## Keyboard Navigation

- Enter/Space on input opens calendar
- Escape closes calendar, returns focus to input

## Accessibility

- Form-associated with ElementInternals
- Calendar uses popover="manual"
- Day buttons have aria-label with formatted date
- aria-invalid on input when invalid

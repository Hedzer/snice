# snice-date-picker

Calendar-based date input with format options and validation.

## Properties

```typescript
value: string = '';
format: 'YYYY-MM-DD'|'DD/MM/YYYY'|'MM/DD/YYYY'|'DD.MM.YYYY'|'YYYY/MM/DD'|'DD-MM-YYYY'|'MM-DD-YYYY' = 'YYYY-MM-DD';
placeholder: string = '';
disabled: boolean = false;
required: boolean = false;
invalid: boolean = false;
readonly: boolean = false;
clearable: boolean = true;
minDate: string = '';
maxDate: string = '';
size: 'small'|'medium'|'large' = 'medium';
name: string = '';
label: string = '';
```

## Methods

- `focus()` - Focus input
- `blur()` - Blur input
- `clear()` - Clear value
- `showCalendar()` - Open calendar
- `hideCalendar()` - Close calendar

## Events

- `change` - {value, datePicker}

## Usage

```html
<!-- Basic -->
<snice-date-picker label="Select date"></snice-date-picker>

<!-- With format -->
<snice-date-picker format="DD/MM/YYYY"></snice-date-picker>

<!-- With min/max -->
<snice-date-picker min-date="2024-01-01" max-date="2024-12-31"></snice-date-picker>

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
document.querySelector('#dp').addEventListener('change', (e) => {
  console.log('Date:', e.detail.value);
});
</script>
```

## Features

- Form-associated custom element
- Calendar popup with month/year navigation
- 7 date format options
- Min/max date validation
- Clearable with X button
- 3 sizes
- Keyboard accessible
- Invalid state styling

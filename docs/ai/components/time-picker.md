# snice-time-picker

Single time selection with hour/minute/second selectors and AM/PM toggle.

## Properties

```typescript
value: string = '';                                   // Time string (HH:MM or HH:MM:SS)
format: '12h'|'24h' = '24h';
size: 'small'|'medium'|'large' = 'medium';
step: 1|5|10|15|30 = 15;                             // Minute step
minTime: string = '';                                 // attribute: min-time
maxTime: string = '';                                 // attribute: max-time
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

- `open()` - Open dropdown
- `close()` - Close dropdown
- `clear()` - Clear value
- `focus()` - Focus input
- `blur()` - Blur input
- `checkValidity()` / `reportValidity()` / `setCustomValidity(msg)`

## Events

- `time-change` -> `{ value, hours, minutes, seconds, formatted, timePicker }`
- `timepicker-focus` -> `{ timePicker }`
- `timepicker-blur` -> `{ timePicker }`
- `timepicker-open` -> `{ timePicker }`
- `timepicker-close` -> `{ timePicker }`
- `timepicker-clear` -> `{ timePicker }`

## Usage

```html
<!-- Basic 24h -->
<snice-time-picker label="Time"></snice-time-picker>

<!-- 12h format -->
<snice-time-picker format="12h" value="14:30"></snice-time-picker>

<!-- With seconds -->
<snice-time-picker show-seconds value="09:15:30"></snice-time-picker>

<!-- 5-minute steps -->
<snice-time-picker step="5"></snice-time-picker>

<!-- Min/max constraints -->
<snice-time-picker min-time="09:00" max-time="17:00"></snice-time-picker>

<!-- Inline (always visible) -->
<snice-time-picker variant="inline" value="10:00"></snice-time-picker>

<!-- Disabled/readonly -->
<snice-time-picker disabled value="12:00"></snice-time-picker>
<snice-time-picker readonly value="15:30"></snice-time-picker>

<!-- Event handling -->
<snice-time-picker id="tp"></snice-time-picker>
<script>
document.querySelector('#tp').addEventListener('time-change', (e) => {
  console.log('Time:', e.detail.value, e.detail.formatted);
});
</script>
```

## CSS Parts

`base`, `label`, `input`, `toggle`, `dropdown`, `hours`, `minutes`, `seconds`, `period`, `clear`, `spinner`, `helper-text`, `error-text`

## Features

- Form-associated custom element
- Hour/minute/second scrollable columns
- AM/PM toggle for 12h format
- Dropdown or inline variant
- 3 sizes (small, medium, large)
- Loading state with spinner
- Clearable with clear button
- Min/max time constraints
- Configurable minute step (1, 5, 10, 15, 30)
- Constraint Validation API (checkValidity, reportValidity, setCustomValidity)
- Keyboard accessible

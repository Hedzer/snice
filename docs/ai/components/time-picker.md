# snice-time-picker

Single time selection with hour/minute/second selectors and AM/PM toggle. Form-associated.

## Properties

```typescript
value: string = '';                    // Time string (HH:MM or HH:MM:SS)
format: '12h'|'24h' = '24h';
size: 'small'|'medium'|'large' = 'medium';
step: 1|5|10|15|30 = 15;              // Minute step
minTime: string = '';                  // attr: min-time
maxTime: string = '';                  // attr: max-time
showSeconds: boolean = false;          // attr: show-seconds
disabled: boolean = false;
readonly: boolean = false;
loading: boolean = false;
clearable: boolean = false;
placeholder: string = '';
label: string = '';
helperText: string = '';               // attr: helper-text
errorText: string = '';                // attr: error-text
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
- `checkValidity()` - Check validation, returns `boolean`
- `reportValidity()` - Report validation to user, returns `boolean`
- `setCustomValidity(message)` - Set custom validation message

## Events

- `time-change` -> `{ value, hours, minutes, seconds, formatted, timePicker }`
- `timepicker-focus` -> `{ timePicker }`
- `timepicker-blur` -> `{ timePicker }`
- `timepicker-open` -> `{ timePicker }`
- `timepicker-close` -> `{ timePicker }`
- `timepicker-clear` -> `{ timePicker }`

## CSS Parts

- `base` - Wrapper container
- `label` - Label element
- `input` - Text input
- `toggle` - Clock icon button
- `dropdown` - Dropdown/inline container
- `hours` - Hours selector column
- `minutes` - Minutes selector column
- `seconds` - Seconds selector column
- `period` - AM/PM selector column
- `clear` - Clear button
- `spinner` - Loading spinner
- `helper-text` - Helper text element
- `error-text` - Error text element

## Basic Usage

```html
<snice-time-picker label="Select time"></snice-time-picker>
<snice-time-picker format="12h" value="14:30"></snice-time-picker>
<snice-time-picker show-seconds value="09:15:30"></snice-time-picker>
<snice-time-picker step="5" min-time="09:00" max-time="17:00"></snice-time-picker>
<snice-time-picker variant="inline" value="10:00"></snice-time-picker>
```

```typescript
picker.addEventListener('time-change', (e) => {
  console.log('Time:', e.detail.value, e.detail.formatted);
});
```

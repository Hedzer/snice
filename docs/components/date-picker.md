<!-- AI: For a low-token version of this doc, use docs/ai/components/date-picker.md instead -->

# Date Picker
`<snice-date-picker>`

Calendar-based date input with format options and validation.

## Basic Usage

```typescript
import 'snice/components/date-picker/snice-date-picker';
```

```html
<snice-date-picker label="Select date"></snice-date-picker>
```

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/date-picker/snice-date-picker';
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-date-picker.min.js"></script>
```

## Examples

### Variants

Use the `variant` attribute to change the input style.

```html
<snice-date-picker variant="outlined" label="Outlined"></snice-date-picker>
<snice-date-picker variant="filled" label="Filled"></snice-date-picker>
<snice-date-picker variant="underlined" label="Underlined"></snice-date-picker>
```

### Sizes

Use the `size` attribute to change the picker size.

```html
<snice-date-picker size="small" label="Small"></snice-date-picker>
<snice-date-picker size="medium" label="Medium"></snice-date-picker>
<snice-date-picker size="large" label="Large"></snice-date-picker>
```

### Date Formats

Use the `format` attribute to control how dates are displayed and parsed.

```html
<snice-date-picker format="mm/dd/yyyy" label="US Format"></snice-date-picker>
<snice-date-picker format="dd/mm/yyyy" label="EU Format"></snice-date-picker>
<snice-date-picker format="yyyy-mm-dd" label="ISO Format"></snice-date-picker>
<snice-date-picker format="mmmm dd, yyyy" label="Long Format"></snice-date-picker>
```

### Min and Max Dates

Use the `min` and `max` attributes to restrict the selectable date range.

```html
<snice-date-picker min="2024-01-01" max="2024-12-31" label="Year 2024 only"></snice-date-picker>
```

### Clearable

Set the `clearable` attribute to show a clear button when a date is selected.

```html
<snice-date-picker value="2024-03-15" clearable label="Clearable"></snice-date-picker>
```

### Helper and Error Text

Use the `helper-text` and `error-text` attributes to provide guidance or validation messages.

```html
<snice-date-picker label="Start Date" helper-text="Choose a date in the future"></snice-date-picker>
<snice-date-picker label="End Date" invalid error-text="End date must be after start date"></snice-date-picker>
```

### Loading

Set the `loading` attribute to show a spinner and disable interaction.

```html
<snice-date-picker loading label="Loading dates"></snice-date-picker>
```

### Disabled and Readonly

Use `disabled` or `readonly` to prevent user interaction.

```html
<snice-date-picker disabled value="2024-06-15" label="Disabled"></snice-date-picker>
<snice-date-picker readonly value="2024-06-15" label="Readonly"></snice-date-picker>
```

### First Day of Week

Use the `first-day-of-week` attribute to set which day starts the week (0 = Sunday, 1 = Monday).

```html
<snice-date-picker first-day-of-week="1" label="Week starts Monday"></snice-date-picker>
```

### Form Integration

Use `name` and `required` for native form participation.

```html
<form>
  <snice-date-picker name="birthdate" required label="Date of Birth"></snice-date-picker>
</form>
```

### Event Handling

Listen for date changes using the `datepicker-change` event.

```html
<snice-date-picker id="dp" label="Pick a date"></snice-date-picker>
<script>
document.querySelector('#dp').addEventListener('datepicker-change', (e) => {
  console.log('Date:', e.detail.formatted);
  console.log('ISO:', e.detail.iso);
});
</script>
```

## Properties

| Property | Attribute | Type | Default | Description |
|----------|-----------|------|---------|-------------|
| `value` | `value` | `string` | `''` | Current date value |
| `format` | `format` | `'yyyy-mm-dd' \| 'mm/dd/yyyy' \| 'dd/mm/yyyy' \| 'yyyy/mm/dd' \| 'dd-mm-yyyy' \| 'mm-dd-yyyy' \| 'mmmm dd, yyyy'` | `'mm/dd/yyyy'` | Display and parse format |
| `variant` | `variant` | `'outlined' \| 'filled' \| 'underlined'` | `'outlined'` | Input visual style |
| `size` | `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Component size |
| `placeholder` | `placeholder` | `string` | `''` | Input placeholder text |
| `label` | `label` | `string` | `''` | Label text |
| `helperText` | `helper-text` | `string` | `''` | Helper text below input |
| `errorText` | `error-text` | `string` | `''` | Error text below input |
| `disabled` | `disabled` | `boolean` | `false` | Disables the picker |
| `readonly` | `readonly` | `boolean` | `false` | Makes the input read-only |
| `loading` | `loading` | `boolean` | `false` | Shows loading spinner |
| `required` | `required` | `boolean` | `false` | Marks as required |
| `invalid` | `invalid` | `boolean` | `false` | Shows invalid styling |
| `clearable` | `clearable` | `boolean` | `false` | Shows clear button |
| `min` | `min` | `string` | `''` | Minimum selectable date |
| `max` | `max` | `string` | `''` | Maximum selectable date |
| `name` | `name` | `string` | `''` | Form field name |
| `showCalendar` | `show-calendar` | `boolean` | `false` | Calendar visibility |
| `firstDayOfWeek` | `first-day-of-week` | `number` | `0` | First day of week (0=Sun) |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `datepicker-input` | `{ value, datePicker }` | Fired on text input |
| `datepicker-change` | `{ value, date, formatted, iso, datePicker }` | Fired when date changes |
| `datepicker-focus` | `{ datePicker }` | Fired on input focus |
| `datepicker-blur` | `{ datePicker }` | Fired on input blur |
| `datepicker-open` | `{ datePicker }` | Fired when calendar opens |
| `datepicker-close` | `{ datePicker }` | Fired when calendar closes |
| `datepicker-clear` | `{ datePicker }` | Fired when value is cleared |
| `datepicker-select` | `{ date, formatted, iso, datePicker }` | Fired when a date is selected |

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `focus()` | — | Focuses the input |
| `blur()` | — | Removes focus |
| `clear()` | — | Clears the selected date |
| `open()` | — | Opens the calendar popup |
| `close()` | — | Closes the calendar popup |
| `selectDate()` | `date: Date` | Programmatically selects a date |
| `goToMonth()` | `year: number, month: number` | Navigates calendar to a month |
| `goToToday()` | — | Selects today's date |
| `checkValidity()` | — | Returns input validity |
| `reportValidity()` | — | Reports input validity |
| `setCustomValidity()` | `message: string` | Sets custom validation message |

## CSS Parts

| Part | Description |
|------|-------------|
| `input` | The text input element |
| `calendar-toggle` | The calendar icon button |
| `clear` | The clear button |
| `spinner` | The loading spinner |
| `calendar` | The calendar popup container |
| `helper-text` | The helper text element |
| `error-text` | The error text element |

<!-- AI: For a low-token version of this doc, use docs/ai/components/date-time-picker.md instead -->

# Date Time Picker
`<snice-date-time-picker>`

Combined date and time picker with calendar and scrollable time selectors.

## Basic Usage

```typescript
import 'snice/components/date-time-picker/snice-date-time-picker';
```

```html
<snice-date-time-picker label="Appointment"></snice-date-time-picker>
```

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/date-time-picker/snice-date-time-picker';
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-date-time-picker.min.js"></script>
```

## Examples

### With Initial Value

Set the `value` attribute with an ISO datetime string.

```html
<snice-date-time-picker value="2024-12-25T14:30" label="Event Start"></snice-date-time-picker>
```

### Time Formats

Use the `time-format` attribute to switch between 12-hour and 24-hour display.

```html
<snice-date-time-picker time-format="24h" label="24-Hour" value="2024-12-25T14:30"></snice-date-time-picker>
<snice-date-time-picker time-format="12h" label="12-Hour" value="2024-12-25T14:30"></snice-date-time-picker>
```

### With Seconds

Set the `show-seconds` attribute to include a seconds selector.

```html
<snice-date-time-picker show-seconds value="2024-12-25T14:30:45" label="Precise Time"></snice-date-time-picker>
```

### Date Format

Use `date-format` to control how the date portion is displayed.

```html
<snice-date-time-picker date-format="mm/dd/yyyy" label="US Format"></snice-date-time-picker>
<snice-date-time-picker date-format="dd/mm/yyyy" label="EU Format"></snice-date-time-picker>
<snice-date-time-picker date-format="yyyy-mm-dd" label="ISO Format"></snice-date-time-picker>
```

### Min and Max Dates

Use `min` and `max` to restrict the selectable date range.

```html
<snice-date-time-picker
  min="2024-12-01"
  max="2024-12-31"
  label="December Only"
  helper-text="Only dates in December 2024">
</snice-date-time-picker>
```

### Inline Variant

Use `variant="inline"` to always show the calendar and time selectors.

```html
<snice-date-time-picker variant="inline" value="2024-06-15T10:00" label="Inline"></snice-date-time-picker>
```

### Helper and Error Text

Use `helper-text` and `error-text` for guidance or validation.

```html
<snice-date-time-picker label="Start" helper-text="Choose a date and time"></snice-date-time-picker>
<snice-date-time-picker label="End" invalid error-text="End must be after start"></snice-date-time-picker>
```

### Disabled and Readonly

```html
<snice-date-time-picker disabled value="2024-12-25T14:30" label="Disabled"></snice-date-time-picker>
<snice-date-time-picker readonly value="2024-12-25T14:30" label="Readonly"></snice-date-time-picker>
```

### Form Integration

Use `name` and `required` for native form participation.

```html
<form>
  <snice-date-time-picker name="appointment" required label="Appointment"></snice-date-time-picker>
</form>
```

### Event Handling

Listen for changes using the `datetime-change` event.

```html
<snice-date-time-picker id="dtp" label="Pick date & time"></snice-date-time-picker>
<script>
document.querySelector('#dtp').addEventListener('datetime-change', (e) => {
  console.log('ISO:', e.detail.iso);
  console.log('Date:', e.detail.dateString);
  console.log('Time:', e.detail.timeString);
});
</script>
```

## Properties

| Property | Attribute | Type | Default | Description |
|----------|-----------|------|---------|-------------|
| `value` | `value` | `string` | `''` | ISO datetime value (YYYY-MM-DDTHH:MM or YYYY-MM-DDTHH:MM:SS) |
| `dateFormat` | `date-format` | `string` | `'yyyy-mm-dd'` | Date display format |
| `timeFormat` | `time-format` | `'12h' \| '24h'` | `'24h'` | Time display format |
| `min` | `min` | `string` | `''` | Minimum selectable date |
| `max` | `max` | `string` | `''` | Maximum selectable date |
| `showSeconds` | `show-seconds` | `boolean` | `false` | Show seconds selector |
| `disabled` | `disabled` | `boolean` | `false` | Disables the picker |
| `readonly` | `readonly` | `boolean` | `false` | Makes input read-only |
| `placeholder` | `placeholder` | `string` | `''` | Input placeholder text |
| `label` | `label` | `string` | `''` | Label text |
| `helperText` | `helper-text` | `string` | `''` | Helper text below input |
| `errorText` | `error-text` | `string` | `''` | Error text below input |
| `required` | `required` | `boolean` | `false` | Marks as required |
| `invalid` | `invalid` | `boolean` | `false` | Shows invalid styling |
| `name` | `name` | `string` | `''` | Form field name |
| `variant` | `variant` | `'dropdown' \| 'inline'` | `'dropdown'` | Display variant |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `datetime-change` | `{ value, date, dateString, timeString, iso, dateTimePicker }` | Fired when date or time changes |
| `datetimepicker-focus` | `{ dateTimePicker }` | Fired on input focus |
| `datetimepicker-blur` | `{ dateTimePicker }` | Fired on input blur |
| `datetimepicker-open` | `{ dateTimePicker }` | Fired when panel opens |
| `datetimepicker-close` | `{ dateTimePicker }` | Fired when panel closes |

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `open()` | -- | Opens the dropdown panel |
| `close()` | -- | Closes the dropdown panel |
| `focus()` | -- | Focuses the input |
| `blur()` | -- | Removes focus |

## CSS Parts

| Part | Description |
|------|-------------|
| `base` | The wrapper container |
| `label` | The label element |
| `input` | The text input |
| `toggle` | The calendar icon button |
| `panel` | The dropdown/inline panel |
| `calendar` | The calendar section |
| `time` | The time selector section |
| `helper-text` | The helper text element |
| `error-text` | The error text element |

## Responsive Behavior

On screens smaller than 480px, the panel stacks the calendar and time selectors vertically instead of side-by-side.

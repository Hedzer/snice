<!-- AI: For a low-token version of this doc, use docs/ai/components/time-picker.md instead -->

# Time Picker
`<snice-time-picker>`

Single time selection with hour/minute/second selectors and AM/PM toggle.

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/time-picker/snice-time-picker';
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-time-picker.min.js"></script>
```

## Properties

| Property | Attribute | Type | Default | Description |
|----------|-----------|------|---------|-------------|
| `value` | `value` | `string` | `''` | Time value (HH:MM or HH:MM:SS) |
| `format` | `format` | `'12h' \| '24h'` | `'24h'` | Display format |
| `size` | `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Component size |
| `step` | `step` | `1 \| 5 \| 10 \| 15 \| 30` | `15` | Minute step interval |
| `minTime` | `min-time` | `string` | `''` | Minimum selectable time |
| `maxTime` | `max-time` | `string` | `''` | Maximum selectable time |
| `showSeconds` | `show-seconds` | `boolean` | `false` | Show seconds selector |
| `disabled` | `disabled` | `boolean` | `false` | Disables the picker |
| `readonly` | `readonly` | `boolean` | `false` | Makes input read-only |
| `loading` | `loading` | `boolean` | `false` | Shows loading spinner |
| `clearable` | `clearable` | `boolean` | `false` | Shows clear button when value is set |
| `placeholder` | `placeholder` | `string` | `''` | Input placeholder text |
| `label` | `label` | `string` | `''` | Label text |
| `helperText` | `helper-text` | `string` | `''` | Helper text below input |
| `errorText` | `error-text` | `string` | `''` | Error text below input |
| `required` | `required` | `boolean` | `false` | Marks as required |
| `invalid` | `invalid` | `boolean` | `false` | Shows invalid styling |
| `name` | `name` | `string` | `''` | Form field name |
| `variant` | `variant` | `'dropdown' \| 'inline'` | `'dropdown'` | Display variant |

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `open()` | -- | Opens the dropdown |
| `close()` | -- | Closes the dropdown |
| `clear()` | -- | Clears the selected time |
| `focus()` | -- | Focuses the input |
| `blur()` | -- | Removes focus |
| `checkValidity()` | -- | Returns input validity |
| `reportValidity()` | -- | Reports input validity |
| `setCustomValidity()` | `message: string` | Sets custom validation message |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `time-change` | `{ value, hours, minutes, seconds, formatted, timePicker }` | Fired when time changes |
| `timepicker-focus` | `{ timePicker }` | Fired on input focus |
| `timepicker-blur` | `{ timePicker }` | Fired on input blur |
| `timepicker-open` | `{ timePicker }` | Fired when dropdown opens |
| `timepicker-close` | `{ timePicker }` | Fired when dropdown closes |
| `timepicker-clear` | `{ timePicker }` | Fired when value is cleared |

## CSS Parts

| Part | Description |
|------|-------------|
| `base` | The wrapper container |
| `label` | The label element |
| `input` | The text input |
| `toggle` | The clock icon button |
| `dropdown` | The dropdown/inline container |
| `hours` | The hours selector column |
| `minutes` | The minutes selector column |
| `seconds` | The seconds selector column |
| `period` | The AM/PM selector column |
| `clear` | The clear button |
| `spinner` | The loading spinner |
| `helper-text` | The helper text element |
| `error-text` | The error text element |

## Basic Usage

```typescript
import 'snice/components/time-picker/snice-time-picker';
```

```html
<snice-time-picker label="Select time"></snice-time-picker>
```

## Examples

### Time Formats

Use the `format` attribute to switch between 12-hour and 24-hour display.

```html
<snice-time-picker format="24h" label="24-Hour" value="14:30"></snice-time-picker>
<snice-time-picker format="12h" label="12-Hour" value="14:30"></snice-time-picker>
```

### With Seconds

Set the `show-seconds` attribute to include a seconds column.

```html
<snice-time-picker show-seconds value="09:15:30" label="Precise Time"></snice-time-picker>
```

### Sizes

Use the `size` attribute to change the picker size.

```html
<snice-time-picker size="small" label="Small"></snice-time-picker>
<snice-time-picker size="medium" label="Medium"></snice-time-picker>
<snice-time-picker size="large" label="Large"></snice-time-picker>
```

### Loading

Set the `loading` attribute to show a spinner and disable interaction.

```html
<snice-time-picker loading label="Loading"></snice-time-picker>
```

### Clearable

Set the `clearable` attribute to show a clear button when a value is selected.

```html
<snice-time-picker value="14:30" clearable label="Clearable"></snice-time-picker>
```

### Step Intervals

Use the `step` attribute to control the minute increment in the selector.

```html
<snice-time-picker step="1" label="Every Minute"></snice-time-picker>
<snice-time-picker step="5" label="5-Minute Steps"></snice-time-picker>
<snice-time-picker step="15" label="15-Minute Steps"></snice-time-picker>
<snice-time-picker step="30" label="30-Minute Steps"></snice-time-picker>
```

### Min and Max Time

Use `min-time` and `max-time` to restrict the selectable time range.

```html
<snice-time-picker
  min-time="09:00"
  max-time="17:00"
  label="Business Hours"
  helper-text="Available 9 AM - 5 PM">
</snice-time-picker>
```

### Inline Variant

Use `variant="inline"` to always show the time selectors without a dropdown.

```html
<snice-time-picker variant="inline" value="10:00" label="Inline Picker"></snice-time-picker>
```

### Helper and Error Text

Use `helper-text` and `error-text` for guidance or validation messages.

```html
<snice-time-picker label="Start" helper-text="Choose a start time"></snice-time-picker>
<snice-time-picker label="End" invalid error-text="End time must be after start"></snice-time-picker>
```

### Disabled and Readonly

```html
<snice-time-picker disabled value="12:00" label="Disabled"></snice-time-picker>
<snice-time-picker readonly value="15:30" label="Readonly"></snice-time-picker>
```

### Form Integration

Use `name` and `required` for native form participation.

```html
<form>
  <snice-time-picker name="startTime" required label="Start Time"></snice-time-picker>
</form>
```

### Form Validation

The component supports the Constraint Validation API. Use `checkValidity()`, `reportValidity()`, and `setCustomValidity()` for custom form validation.

```html
<form>
  <snice-time-picker name="startTime" required label="Start Time"></snice-time-picker>
  <button type="submit">Submit</button>
</form>
```

```typescript
picker.setCustomValidity('Please select a time during business hours');
picker.reportValidity();
```

### Event Handling

Listen for time changes using the `time-change` event.

```html
<snice-time-picker label="Pick a time"></snice-time-picker>
```

```typescript
picker.addEventListener('time-change', (e) => {
  console.log('Value:', e.detail.value);
  console.log('Formatted:', e.detail.formatted);
  console.log('Hours:', e.detail.hours, 'Minutes:', e.detail.minutes);
});
```

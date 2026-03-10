<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/date-range-picker.md -->

# Date Range Picker
`<snice-date-range-picker>`

Date range selection with an interactive calendar dropdown, optional presets sidebar, year picker, and support for multiple date formats. Form-associated custom element.

## Table of Contents
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Accessibility](#accessibility)

## Properties

| Property | Attribute | Type | Default | Description |
|----------|-----------|------|---------|-------------|
| `start` | `start` | `string` | `''` | Start date (formatted string or ISO) |
| `end` | `end` | `string` | `''` | End date (formatted string or ISO) |
| `size` | `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Input size |
| `variant` | `variant` | `'outlined' \| 'filled' \| 'underlined'` | `'outlined'` | Input style variant |
| `format` | `format` | `DateRangeFormat` | `'mm/dd/yyyy'` | Date display format |
| `placeholder` | `placeholder` | `string` | `''` | Input placeholder text |
| `label` | `label` | `string` | `''` | Label text |
| `helperText` | `helper-text` | `string` | `''` | Helper text below input |
| `errorText` | `error-text` | `string` | `''` | Error text below input |
| `disabled` | `disabled` | `boolean` | `false` | Disables the component |
| `readonly` | `readonly` | `boolean` | `false` | Makes the component read-only |
| `loading` | `loading` | `boolean` | `false` | Shows loading spinner |
| `required` | `required` | `boolean` | `false` | Marks as required |
| `invalid` | `invalid` | `boolean` | `false` | Shows error styling |
| `clearable` | `clearable` | `boolean` | `false` | Shows clear button |
| `min` | `min` | `string` | `''` | Minimum selectable date (ISO format) |
| `max` | `max` | `string` | `''` | Maximum selectable date (ISO format) |
| `name` | `name` | `string` | `''` | Form field name |
| `columns` | `columns` | `number` | `1` | Calendar columns (1 or 2) |
| `firstDayOfWeek` | `first-day-of-week` | `number` | `0` | First day of week (0=Sun) |
| `presets` | N/A | `DateRangePreset[]` | `[]` | Preset ranges (JS only) |
| `showCalendar` | `show-calendar` | `boolean` | `false` | Calendar visibility |

### DateRangePreset Object

```typescript
interface DateRangePreset {
  label: string;
  start: Date;
  end: Date;
}
```

### Supported Formats

`'mm/dd/yyyy'` | `'dd/mm/yyyy'` | `'yyyy-mm-dd'` | `'yyyy/mm/dd'` | `'dd-mm-yyyy'` | `'mm-dd-yyyy'` | `'mmmm dd, yyyy'`

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `open()` | -- | Open the calendar dropdown |
| `close()` | -- | Close the calendar dropdown |
| `clear()` | -- | Clear both dates |
| `focus()` | -- | Focus the input |
| `blur()` | -- | Blur the input |
| `selectRange()` | `start: Date, end: Date` | Programmatically select a date range |
| `checkValidity()` | -- | Check form validity |
| `reportValidity()` | -- | Report form validity |
| `setCustomValidity()` | `message: string` | Set custom validation message |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `daterange-change` | `{ start, end, startDate, endDate, startIso, endIso }` | Range selected or cleared |
| `daterange-open` | `{ dateRangePicker }` | Calendar opened |
| `daterange-close` | `{ dateRangePicker }` | Calendar closed |
| `daterange-clear` | `{ dateRangePicker }` | Range cleared |
| `daterange-preset` | `{ label, start, end, dateRangePicker }` | Preset selected |
| `daterange-focus` | `{ dateRangePicker }` | Input focused |
| `daterange-blur` | `{ dateRangePicker }` | Input blurred |

## CSS Parts

| Part | Description |
|------|-------------|
| `input` | The text input element |
| `calendar-toggle` | Calendar icon button |
| `clear` | Clear button |
| `spinner` | Loading spinner |
| `calendar` | Calendar dropdown container |
| `helper-text` | Helper text element |
| `error-text` | Error text element |

## Basic Usage

```typescript
import 'snice/components/date-range-picker/snice-date-range-picker';
```

```html
<snice-date-range-picker label="Select Date Range" clearable></snice-date-range-picker>
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-date-range-picker.min.js"></script>
```

## Examples

### Dual Column Calendar

Use the `columns` attribute to show two months side-by-side for easier range selection.

```html
<snice-date-range-picker label="Booking Dates" columns="2" clearable></snice-date-range-picker>
```

### Presets

Set the `presets` property via JavaScript to add quick-select preset buttons to the calendar sidebar.

```html
<snice-date-range-picker id="my-picker" label="Report Period" columns="2" clearable></snice-date-range-picker>
```

```typescript
const today = new Date();

picker.presets = [
  { label: 'Last 7 days', start: new Date(Date.now() - 7 * 86400000), end: today },
  { label: 'Last 30 days', start: new Date(Date.now() - 30 * 86400000), end: today },
  { label: 'This month', start: new Date(today.getFullYear(), today.getMonth(), 1), end: new Date(today.getFullYear(), today.getMonth() + 1, 0) },
];
```

Hovering over a preset shows a dashed preview of the range on the calendar. Clicking a preset selects both dates and closes the calendar.

### Date Formats

Use the `format` attribute to control how dates are displayed.

```html
<snice-date-range-picker format="mm/dd/yyyy"></snice-date-range-picker>
<snice-date-range-picker format="dd/mm/yyyy"></snice-date-range-picker>
<snice-date-range-picker format="yyyy-mm-dd"></snice-date-range-picker>
<snice-date-range-picker format="mmmm dd, yyyy"></snice-date-range-picker>
```

The `start` and `end` attributes accept ISO format (`yyyy-mm-dd`) regardless of the display format.

### Sizes and Variants

Use the `size` and `variant` attributes to control the input appearance.

```html
<snice-date-range-picker size="small"></snice-date-range-picker>
<snice-date-range-picker size="medium"></snice-date-range-picker>
<snice-date-range-picker size="large"></snice-date-range-picker>

<snice-date-range-picker variant="outlined"></snice-date-range-picker>
<snice-date-range-picker variant="filled"></snice-date-range-picker>
<snice-date-range-picker variant="underlined"></snice-date-range-picker>
```

### States

Use `required`, `invalid`, `disabled`, `readonly`, and `loading` for different interaction states.

```html
<snice-date-range-picker required helper-text="Required field"></snice-date-range-picker>
<snice-date-range-picker invalid error-text="Invalid range"></snice-date-range-picker>
<snice-date-range-picker disabled start="2026-03-01" end="2026-03-15"></snice-date-range-picker>
<snice-date-range-picker readonly start="2026-03-01" end="2026-03-15"></snice-date-range-picker>
<snice-date-range-picker loading></snice-date-range-picker>
```

### Year Picker

Click the year in the calendar header to open a 12-year grid. Navigate between year ranges with the arrow buttons, then click a year to return to the day view.

### Form Integration

The component is form-associated. When used inside a `<form>` with a `name` attribute, it submits two values: `{name}-start` and `{name}-end`.

```html
<form>
  <snice-date-range-picker name="trip" required clearable></snice-date-range-picker>
  <button type="submit">Submit</button>
</form>
```

### Event Handling

Listen for range changes using the `daterange-change` event.

```typescript
picker.addEventListener('daterange-change', (e) => {
  console.log('Start:', e.detail.startIso, 'End:', e.detail.endIso);
});
```

## Accessibility

- Form-associated custom element with `ElementInternals`
- Calendar popup uses `popover="manual"` for proper layering
- Navigation buttons have `aria-label` attributes
- Required fields show visual indicator on the label
- Calendar toggle button has `aria-label="Toggle calendar"`
- Clear button has `aria-label="Clear"`

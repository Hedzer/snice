# Date Range Picker Design

`<snice-date-range-picker>` — A date range picker with two connected inputs, shared calendar dropdown, range highlighting, and optional presets.

## Input Area

Two side-by-side inputs in a shared visual container:
- "Start date" and "End date" placeholders (auto-derived from format)
- Each input independently typeable
- Single calendar icon toggle on the right side
- Clear button clears both dates
- Connected visually (shared border, single container)

## Calendar Dropdown

- `columns` attribute: `1` (default) or `2` (side-by-side months)
- Selection flow: click start date, then click end date
- Range between start/end gets highlighted background
- Clicking a date before current start resets — becomes new start
- Hover preview: shows range highlight before confirming end date
- "Today" button in footer
- Month navigation arrows (prev/next)
- Calendar positioned below the input container

## Presets

- `presets` property: `Array<{ label: string, start: Date | string, end: Date | string }>`
- `@property({ type: Array, attribute: false })` — no DOM reflection
- Rendered as vertical button list on the left side of the calendar dropdown
- On small screens / single column: presets render above the calendar
- Clicking a preset selects both dates and closes the calendar
- Empty by default — user provides presets

## Properties

| Property | Type | Default | Notes |
|----------|------|---------|-------|
| `start` | `string` | `''` | Start date (formatted string) |
| `end` | `string` | `''` | End date (formatted string) |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | |
| `variant` | `'outlined' \| 'filled' \| 'underlined'` | `'outlined'` | |
| `format` | `DateFormat` | `'mm/dd/yyyy'` | Same formats as date-picker |
| `label` | `string` | `''` | |
| `helper-text` | `string` | `''` | |
| `error-text` | `string` | `''` | |
| `disabled` | `boolean` | `false` | |
| `readonly` | `boolean` | `false` | |
| `required` | `boolean` | `false` | |
| `invalid` | `boolean` | `false` | |
| `clearable` | `boolean` | `false` | |
| `min` | `string` | `''` | Minimum selectable date |
| `max` | `string` | `''` | Maximum selectable date |
| `name` | `string` | `''` | Form submits as `{name}-start` and `{name}-end` |
| `columns` | `1 \| 2` | `1` | Number of months shown in calendar |
| `first-day-of-week` | `number` | `0` | 0=Sunday, 1=Monday |
| `presets` | `DateRangePreset[]` | `[]` | `attribute: false` — no DOM reflection |
| `show-calendar` | `boolean` | `false` | Calendar open state |

## Events

| Event | Detail |
|-------|--------|
| `daterange-change` | `{ start, end, startDate, endDate, startIso, endIso }` |
| `daterange-input` | `{ value, field: 'start' \| 'end' }` |
| `daterange-open` | `{ dateRangePicker }` |
| `daterange-close` | `{ dateRangePicker }` |
| `daterange-clear` | `{ dateRangePicker }` |
| `daterange-preset` | `{ label, start, end }` |

## Methods

- `open()` / `close()` — toggle calendar
- `clear()` — clear both dates
- `focus()` / `blur()` — focus start input
- `selectRange(start: Date, end: Date)` — programmatic selection
- `checkValidity()` / `reportValidity()` / `setCustomValidity(msg)` — form validation

## Calendar Range Highlighting CSS

Three visual states for day cells:
- `day--range-start` — start date (full primary bg, rounded left)
- `day--range-end` — end date (full primary bg, rounded right)
- `day--in-range` — between start and end (subtle primary bg, no rounding)
- `day--range-preview` — hover preview before end is confirmed (lighter bg)

## Form Integration

- `formAssociated: true`
- Submits two values: `{name}-start` and `{name}-end`
- Both use the configured `format` for the submitted value

## File Structure

```
components/date-range-picker/
  snice-date-range-picker.ts
  snice-date-range-picker.types.ts
  snice-date-range-picker.css
  demo.html
```

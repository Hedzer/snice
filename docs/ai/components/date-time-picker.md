# snice-date-time-picker

Editable local date-time field with calendar and time selectors. Form-associated; never converts to UTC.

## Canonical form value

```text
showSeconds=false -> YYYY-MM-DDTHH:mm
showSeconds=true  -> YYYY-MM-DDTHH:mm:ss
```

Malformed/partial/impossible text stays visible, sets `badInput`, and contributes an empty form value. Date and time parts are strict and never roll; DST gaps/repeated times remain unchanged local wall times.

```html
<form>
  <snice-date-time-picker
    name="appointment"
    value="2026-03-10T14:05"
    min="2026-03-10T09:30"
    max="2026-03-20T17:45"
    required
  ></snice-date-time-picker>
</form>
```

## Live/default semantics

```typescript
picker.value: string;        // live value; does not reflect
picker.defaultValue: string; // value attribute / reset default
```

- `form.reset()` restores `defaultValue` without customer events.
- Attribute/default changes update live state only while pristine.
- State restore accepts strings, preserves exact visible text, and ignores `File`, `FormData`, and `null`.
- Pre-upgrade `value` property assignment is adopted.

## Properties

```typescript
value = '';
defaultValue = ''; // attribute: value
dateFormat: 'yyyy-mm-dd'|'mm/dd/yyyy'|'dd/mm/yyyy'|'yyyy/mm/dd'|'dd-mm-yyyy'|'mm-dd-yyyy'|'mmmm dd, yyyy' = 'yyyy-mm-dd';
timeFormat: '12h'|'24h' = '24h';
size: 'small'|'medium'|'large' = 'medium';
min = ''; // date-only or canonical local datetime
max = ''; // date-only or canonical local datetime
showSeconds = false;
loading = false;
clearable = false;
disabled = false;
readonly = false;
placeholder = '';
label = '';
helperText = ''; // helper-text
errorText = '';  // error-text
required = false;
invalid = false; // authored visual state
name = '';
variant: 'dropdown'|'inline' = 'dropdown';
```

`dateFormat` and `timeFormat` control display/input presentation only; canonical form submission stays local ISO syntax.

Date-only `min` starts at `00:00:00`; date-only `max` includes `23:59:59`. Impossible constraints are ignored rather than normalized.

## Native form API

```typescript
readonly type: 'datetime-local';
readonly form: HTMLFormElement | null;
readonly validity: ValidityState;
readonly validationMessage: string;
readonly willValidate: boolean;
readonly labels: NodeList | null;
checkValidity(): boolean;
reportValidity(): boolean;
setCustomValidity(message: string): void;
```

Validity mapping:

- required empty -> `valueMissing`
- partial/malformed/impossible -> `badInput`
- before `min` -> `rangeUnderflow`
- after `max` -> `rangeOverflow`
- custom message -> `customError`

`disabled`/disabled fieldset: no interaction, omitted from FormData, barred validation. First-legend exception works. `readonly`: submitted but barred. `loading`: submitted but interaction/validation blocked.

## Methods and events

Methods: `open()`, `close()`, `clear()`, `focus()`, `blur()`, validation methods above.

Events:

- `datetime-change` -> `{ value, date, dateString, timeString, iso, dateTimePicker }`
- `datetimepicker-focus` / `datetimepicker-blur`
- `datetimepicker-open` / `datetimepicker-close`
- `datetimepicker-clear`

Reset/restore do not emit customer events. Clear preserves existing event order: clear, then change.

Popup is top-layer when available, viewport-clamped, internally scrollable, and responsive. All seven date formats, 12/24-hour modes, seconds, sizes, dropdown/inline variants, year/month/Today navigation, loading, clear, helper/error text, methods, and existing events remain supported.

## CSS Parts

- `base` - Root wrapper around the whole control
- `label` - Field label above the input
- `label-required` - Added to `label` when `required` is set
- `input-container` - Wrapper holding the input, its toggle and clear buttons
- `input` - Text input
- `input-invalid` - Added to `input` while the value is invalid
- `input-loading` - Added to `input` while `loading` is set
- `toggle` - Button that opens the date and time panel
- `clear` - Clear button
- `spinner` - Loading spinner
- `panel` - Dropdown (or inline) panel holding the calendar and time columns
- `panel-inline` - Added to `panel` when `variant="inline"`
- `calendar` - Calendar half of the panel
- `calendar-header` - Header row of the calendar (navigation plus title)
- `nav-button` - Any month/year navigation button
- `nav-button-prev` - Added to `nav-button` on the previous month/years button
- `nav-button-next` - Added to `nav-button` on the next month/years button
- `calendar-title` - Title block between the navigation buttons
- `month-label` - Month name, or year range in the year view
- `year-button` - Year button in the title that opens the year grid
- `year-grid` - Grid of selectable years
- `year-cell` - A single year button in the year grid
- `year-cell-current` - Added to `year-cell` for the current year
- `year-cell-selected` - Added to `year-cell` for the year in view
- `weekdays` - Weekday header row
- `weekday` - A single weekday header cell
- `days` - Day grid
- `day` - A single day cell
- `day-today` - Added to `day` for today's date
- `day-selected` - Added to `day` for the selected date
- `day-disabled` - Added to `day` when the date is outside `min`/`max`
- `day-empty` - Added to `day` on the blank cells before the first of the month
- `calendar-footer` - Footer holding the Today button
- `today-button` - The Today button
- `time` - Time half of the panel
- `time-header` - "Time" heading above the time columns
- `time-selectors` - Row of time columns
- `time-column` - A single hour/minute/second/period column
- `time-column-period` - Added to `time-column` on the AM/PM column
- `time-label` - Column heading (Hr, Min, Sec, Period)
- `time-list` - Scrolling listbox inside a time column
- `time-item` - A single selectable time value
- `time-item-selected` - Added to `time-item` for the selected value
- `helper-text` - Helper text
- `error-text` - Error text

## Accessibility

External `<label for>`, wrapping labels, and multiple labels are live and returned by `labels` in document order. Text/association changes, host `id`, DOM moves, insertion/removal, and reconnect update naming. External labels take precedence; fallback is `label`, then `Date and time`.

Label activation focuses the editable input without opening the dropdown. Inline activation focuses the composite panel. Disabled controls remain inert. The panel, calendar, hours, minutes, optional seconds, and period groups are named independently from the same accessible name; date buttons use formatted date names.

Exactly one helper/error node is connected with `aria-describedby`; error replaces helper, uses `role="alert"`, and visual `invalid` mirrors to `aria-invalid` without replacing native validity APIs.

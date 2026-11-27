# snice-date-range-picker

Form-associated calendar control for selecting a start/end pair. Live strings, authored reset defaults, display formatting, and canonical submitted fields are separate.

## Import

```typescript
import 'snice/components/date-range-picker/snice-date-range-picker';
```

## API

```typescript
// Live strings. Accept canonical YYYY-MM-DD or the configured display format.
// Assignment is silent, dirty, and does not change either content attribute.
start: string = '';
end: string = '';

// Map to the start/end content attributes and are restored by form reset.
defaultStart: string = '';
defaultEnd: string = '';

format: 'mm/dd/yyyy' | 'dd/mm/yyyy' | 'yyyy-mm-dd' | 'yyyy/mm/dd'
      | 'dd-mm-yyyy' | 'mm-dd-yyyy' | 'mmmm dd, yyyy' = 'mm/dd/yyyy';

size: 'small' | 'medium' | 'large' = 'medium';
variant: 'outlined' | 'filled' | 'underlined' = 'outlined';
placeholder: string = '';
label: string = '';
helperText: string = ''; // helper-text
errorText: string = '';  // error-text
disabled | readonly | loading | required | clearable: boolean = false;
invalid: boolean = false; // presentation only, not constraint validity
min: string = ''; max: string = '';   // canonical YYYY-MM-DD recommended
name: string = '';        // base name for {name}-start and {name}-end
columns: number = 1;      // supported layouts: 1 or 2
firstDayOfWeek: number = 0; // first-day-of-week; 0=Sunday
presets: DateRangePreset[] = []; // JS property only; Date|string endpoints
showCalendar: boolean = false;   // show-calendar

readonly form: HTMLFormElement | null;
readonly validity: ValidityState;
readonly validationMessage: string;
readonly willValidate: boolean;
readonly labels: NodeList | null;

focus(): void;
blur(): void;
clear(): void;
open(): void;
close(): void;
selectRange(start: Date, end: Date): void;
checkValidity(): boolean;
reportValidity(): boolean;
setCustomValidity(message: string): void;
```

## Live/default/display contract

- `start` and `end` are current strings. Valid canonical or configured-format assignment is accepted without rewriting it.
- `defaultStart`/`defaultEnd` map to the `start`/`end` attributes and form the authored reset pair.
- Assigning, selecting, clearing, or browser restoration dirties live state. Later default changes do not overwrite a dirty range.
- `form.reset()` clears dirtiness and silently restores both current defaults. A partial default remains partial and invalid when required.
- `format` controls visible text and formatted-string parsing. Changing it never changes already parsed live/default state or submitted values.
- Calendar and preset selection write live strings in the configured display format.
- Direct reversed assignments remain reversed and invalid. `selectRange(Date, Date)` preserves its selection convenience and orders reversed valid arguments.
- Each endpoint is strict local-calendar data: month-length and Gregorian leap-year failures never roll into another month.
- An impossible live/default/restored endpoint remains observable as its exact string, submits `''`, sets `badInput`, and never mutates its peer.
- Invalid `Date` arguments and presets with an impossible endpoint are ignored atomically without preview, mutation, close, or events.

```html
<form id="booking">
  <snice-date-range-picker
    id="stay"
    name="booking"
    start="2026-03-10"
    end="2026-03-20"
    format="dd/mm/yyyy"
  ></snice-date-range-picker>
  <button type="reset">Reset</button>
</form>
```

```typescript
stay.start;        // '2026-03-10'; visible start is '10/03/2026'
stay.defaultStart; // '2026-03-10'
stay.start = '12/03/2026';
stay.getAttribute('start'); // '2026-03-10'
booking.reset();            // stay.start === '2026-03-10'
```

## Form contract

- The host is listed in `form.elements`; `form` exposes the nearest or explicit `form="id"` owner.
- An enabled picker with `name="booking"` contributes exactly two `FormData` entries: `booking-start` and `booking-end`.
- Each parseable endpoint is submitted as local-calendar `YYYY-MM-DD`, independent of the visible `format` and preserved live string.
- Empty/unparseable endpoints contribute `''`. A named optional empty picker still contributes both empty fields. Empty `name` contributes nothing.
- Partial, malformed, reversed, and out-of-bounds ranges may remain observable in `FormData`, but validity blocks interactive submission.
- `disabled` and effective disabled-fieldset descendants are omitted and barred. The first `<legend>` exception is supported without rewriting the authored `disabled` property/attribute.
- `readonly` and `loading` retain submitted values. Both block interaction and are barred from validation.
- Browser history/autofill restoration accepts the saved endpoint pair, is atomic for malformed state, and emits no customer events.

```typescript
Array.from(new FormData(booking).entries());
// [['booking-start', '2026-03-10'], ['booking-end', '2026-03-20']]
```

## Validation

- Optional completely empty pair: valid.
- `required` + incomplete/invalid pair: `valueMissing` (with `badInput` for partial/malformed input).
- Partial or unparseable endpoint: `badInput`.
- Reversed parseable range: `customError`; values are not silently normalized.
- `min`/`max`: inclusive bounds applied to both endpoints, using `rangeUnderflow`/`rangeOverflow`; out-of-range days are disabled.
- Canonical constraints are recommended; configured display-format strings remain accepted. Impossible constraints are ignored rather than normalized.
- `setCustomValidity(message)` sets `customError`; `setCustomValidity('')` clears it.
- `invalid` and `errorText` are visual presentation only and do not establish constraint invalidity.

## Events

```typescript
'daterange-change' -> {
  start, end, startDate, endDate, startIso, endIso, dateRangePicker
}
'daterange-preset' -> { label, start, end, dateRangePicker }
'daterange-clear'  -> { dateRangePicker }
'daterange-open'   -> { dateRangePicker }
'daterange-close'  -> { dateRangePicker }
'daterange-focus'  -> { dateRangePicker }
'daterange-blur'   -> { dateRangePicker }
```

`startIso`/`endIso` are canonical local dates. All component events bubble and are composed. Direct assignments, default changes, reset, and restoration are silent. Clear emits `daterange-clear` before `daterange-change`; preset selection emits change before preset.

## CSS Parts

- `base` - Root wrapper around the whole control
- `label` - Field label above the input
- `label-required` - Added to `label` when `required` is set
- `input-container` - Wrapper holding the input, its buttons and the calendar popup
- `input` - Read-only input showing the selected range
- `input-invalid` - Added to `input` while the value is invalid
- `input-clearable` - Added to `input` when `clearable` is set
- `input-loading` - Added to `input` while `loading` is set
- `calendar-toggle` - Calendar button
- `clear` - Clear button
- `clear-visible` - Added to `clear` while the clear button is shown
- `spinner` - Loading spinner
- `calendar` - Calendar popup
- `calendar-open` - Added to `calendar` while the popup is open
- `calendar-body` - Body of the popup holding the presets and month panels
- `presets` - Preset range button column
- `preset` - A single preset range button
- `months` - Row of month panels
- `month` - A single month panel
- `calendar-header` - Header row of the calendar (navigation plus title)
- `nav-button` - Any month/year navigation button
- `nav-button-prev` - Added to `nav-button` on the previous month/years button
- `nav-button-next` - Added to `nav-button` on the next month/years button
- `nav-button-hidden` - Added to `nav-button` when the button is hidden in the dual-month layout
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
- `day-range-start` - Added to `day` for the start of the selected range
- `day-range-end` - Added to `day` for the end of the selected range
- `day-in-range` - Added to `day` for dates inside the confirmed range
- `day-range-preview` - Added to `day` for dates in the hover preview while selecting
- `day-preset-preview` - Added to `day` for dates inside a hovered preset range
- `day-preset-preview-endpoint` - Added to `day` for the endpoints of a hovered preset range
- `day-disabled` - Added to `day` when the date is outside `min`/`max`
- `day-empty` - Added to `day` on the blank cells before the first of the month
- `calendar-footer` - Footer holding the Today button
- `today-button` - The Today button
- `today-button-base` - Exported `base` of the internal Today button
- `today-button-label` - Exported `label` of the internal Today button
- `today-button-icon` - Exported `icon` of the internal Today button
- `today-button-spinner` - Exported `spinner` of the internal Today button
- `today-button-icon-start` - Exported `icon-start` of the internal Today button (icon before the label)
- `today-button-icon-end` - Exported `icon-end` of the internal Today button (icon after the label)
- `today-button-base-loading` - Exported `base-loading` of the internal Today button (button while loading)
- `today-button-base-disabled` - Exported `base-disabled` of the internal Today button (button while disabled)
- `helper-text` - Helper text
- `error-text` - Error text

## Accessibility

Enter/Space opens from the range input; Escape closes. Calendar days, presets, month/year navigation, and Today are labeled buttons. The popup uses `popover="manual"`, stays clamped to the viewport, scrolls internally when needed, and repositions on page scroll/resize. Required, effective disabledness, loading, and visual `aria-invalid` state are mirrored to the visible input.

External `<label for>`, wrapping labels, and multiple labels form one live name for the complete range; `labels` returns them in document order. Label text/association, host `id`, DOM moves, insertion/removal, and reconnect stay synchronized. External labels take precedence; fallback is `label`, then `Date range`. Activation focuses without opening, while disabled controls remain inert.

Helper/error content is referenced exactly once with `aria-describedby`; error replaces helper and has `role="alert"`. The popup is a separately named `<accessible name> calendar` group, so the canonical start/end submission model does not create unnamed or duplicate visible fields.

# Snice Date Range Picker

Calendar-backed start/end selection with seven display formats, presets, single- or dual-month layouts, range preview, and a complete native form lifecycle.

## Core model

- `start`/`end` are live strings. They accept canonical `YYYY-MM-DD` or the configured display format and are not rewritten on assignment.
- `defaultStart`/`defaultEnd` map to the `start`/`end` attributes and define the pair restored by form reset.
- `format` changes visible text, never the canonical submitted fields.
- A picker named `booking` contributes `booking-start` and `booking-end` to `FormData`, each as canonical local-calendar `YYYY-MM-DD` or `''`.
- The visible UI remains one named range field: explicit, wrapping, and multiple labels are live, focus without opening, and name the calendar separately.
- Partial, malformed, impossible, reversed, required-empty, and min/max-invalid ranges expose native validity without silently changing customer data.
- Every endpoint uses strict local-calendar parsing: month lengths and Gregorian leap years round-trip exactly, with no JavaScript `Date` rollover or UTC date shift.
- Reset, restoration, explicit form ownership, disabled fieldsets, the first-legend exception, readonly/loading states, and custom validity are supported.

```html
<form id="trip">
  <snice-date-range-picker
    id="booking"
    name="booking"
    start="2026-03-10"
    end="2026-03-20"
    format="dd/mm/yyyy"
    min="2026-03-01"
    max="2026-03-31"
    columns="2"
    label="Booking dates"
    clearable
    required
  ></snice-date-range-picker>
  <button type="submit">Submit</button>
  <button type="reset">Reset</button>
</form>
```

```typescript
booking.start;        // '2026-03-10'; visible start is '10/03/2026'
booking.defaultStart; // '2026-03-10'
Array.from(new FormData(trip).entries());
// [['booking-start', '2026-03-10'], ['booking-end', '2026-03-20']]

booking.start = '12/03/2026'; // live value only
trip.reset();                  // restores both authored attributes
```

## Properties

| Property | Attribute | Type/default | Purpose |
|----------|-----------|--------------|---------|
| `start` / `end` | -- | `string = ''` | Live endpoint strings. |
| `defaultStart` / `defaultEnd` | `start` / `end` | `string = ''` | Authored/reset defaults. |
| `format` | `format` | `DateRangeFormat = 'mm/dd/yyyy'` | Visible format and formatted-string boundary. |
| `size` | `size` | `'small' \| 'medium' \| 'large'` | Control/calendar size. |
| `variant` | `variant` | `'outlined' \| 'filled' \| 'underlined'` | Input visual variant. |
| `placeholder` | `placeholder` | `string` | Explicit placeholder; otherwise a format hint. |
| `label` | `label` | `string` | Visible label. |
| `helperText` | `helper-text` | `string` | Supporting text. |
| `errorText` | `error-text` | `string` | Visible error text. |
| `disabled` | `disabled` | `boolean` | Authored disabled state. |
| `readonly` | `readonly` | `boolean` | Non-interactive successful control, barred from validation. |
| `loading` | `loading` | `boolean` | Spinner/interaction lock; values remain successful and validation is barred. |
| `required` | `required` | `boolean` | Requires two valid endpoints. |
| `invalid` | `invalid` | `boolean` | Visual/ARIA presentation only. |
| `clearable` | `clearable` | `boolean` | Shows clear affordance for non-empty live state. |
| `min` / `max` | same | `string` | Inclusive bounds applied to both endpoints. |
| `name` | `name` | `string` | Base key for the two submitted fields. |
| `columns` | `columns` | `number = 1` | One- or two-month calendar layout. |
| `firstDayOfWeek` | `first-day-of-week` | `number = 0` | First weekday column. |
| `presets` | -- | `DateRangePreset[]` | JavaScript-only quick ranges using `Date` or string endpoints. |
| `showCalendar` | `show-calendar` | `boolean` | Popup state. |

Read-only native properties: `form`, `validity`, `validationMessage`, `willValidate`, and `labels`.

Formats: `mm/dd/yyyy`, `dd/mm/yyyy`, `yyyy-mm-dd`, `yyyy/mm/dd`, `dd-mm-yyyy`, `mm-dd-yyyy`, and `mmmm dd, yyyy`. Numeric formats accept `/` and `-` separators for compatibility.

## Methods

- `focus()` / `blur()`
- `clear()`
- `open()` / `close()`
- `selectRange(startDate, endDate)`; reversed valid arguments are ordered, invalid `Date` arguments are ignored
- `checkValidity()` / `reportValidity()`
- `setCustomValidity(message)`

## Validation and lifecycle

- Optional empty is valid; a named optional empty range still contributes two empty form fields.
- Required incomplete ranges use `valueMissing`; partial/unparseable endpoints use `badInput`.
- Impossible live/default/restored endpoint strings are preserved exactly, submit `''`, and never mutate the other endpoint.
- Reversed directly assigned values use `customError` and are preserved exactly.
- Both endpoints are checked against inclusive `min`/`max`, producing `rangeUnderflow`/`rangeOverflow`.
- Impossible constraints and presets are ignored rather than normalized to another calendar day.
- `setCustomValidity()` participates in native validation. `invalid`/`errorText` are visual presentation only, not a validity API.
- Disabled controls are omitted; readonly/loading controls retain `FormData` values. Disabled/readonly/loading controls are barred from validation.
- Form reset restores both authored defaults silently. Browser restoration is atomic and silent. Dynamic name/constraints and reconnect preserve form state.

## Events

- `daterange-change` → `{ start, end, startDate, endDate, startIso, endIso, dateRangePicker }`
- `daterange-preset` → `{ label, start, end, dateRangePicker }`
- `daterange-clear`, `daterange-open`, `daterange-close`, `daterange-focus`, `daterange-blur` → `{ dateRangePicker }`

Canonical event fields use local-calendar `YYYY-MM-DD`. Events bubble and are composed. Direct assignments and form lifecycle changes are silent.

## CSS parts

`input`, `calendar-toggle`, `clear`, `spinner`, `calendar`, `helper-text`, `error-text`.

The calendar popup flips or clamps within the viewport, becomes internally scrollable when necessary, and tracks scroll/resize while open.

See the complete human reference at `docs/components/date-range-picker.md` and the compact AI contract at `docs/ai/components/date-range-picker.md`.

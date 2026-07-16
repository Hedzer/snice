<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/date-range-picker.md -->

# Date Range Picker Component

`<snice-date-range-picker>` selects a start and end date through a calendar, optional presets, and one- or two-month layouts. It preserves configurable display strings while submitting a stable canonical pair through native forms.

## Table of Contents

- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Live Values and Reset Defaults](#live-values-and-reset-defaults)
- [Canonical Form Submission](#canonical-form-submission)
- [Labels and Descriptions](#labels-and-descriptions)
- [Validation](#validation)
- [Formats and Presets](#formats-and-presets)
- [Examples](#examples)
- [Keyboard Navigation](#keyboard-navigation)
- [Accessibility](#accessibility)

## Properties

| Property | Attribute | Type | Default | Description |
|----------|-----------|------|---------|-------------|
| `start` | -- | `string` | `''` | Live start string. Accepts canonical `YYYY-MM-DD` or the configured display format. Assignment is silent and does not rewrite the reset default. |
| `end` | -- | `string` | `''` | Live end string. Accepts canonical `YYYY-MM-DD` or the configured display format. Assignment is silent and does not rewrite the reset default. |
| `defaultStart` | `start` | `string` | `''` | Authored start value and form-reset start default. |
| `defaultEnd` | `end` | `string` | `''` | Authored end value and form-reset end default. |
| `size` | `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Input and calendar size. |
| `variant` | `variant` | `'outlined' \| 'filled' \| 'underlined'` | `'outlined'` | Input visual style. |
| `format` | `format` | `DateRangeFormat` | `'mm/dd/yyyy'` | Visible date format and accepted formatted-string boundary. It does not change canonical form values. |
| `placeholder` | `placeholder` | `string` | format hint | Explicit placeholder. When empty, a range hint is derived from `format`. |
| `label` | `label` | `string` | `''` | Visible label text. |
| `helperText` | `helper-text` | `string` | `''` | Supporting text below the input. |
| `errorText` | `error-text` | `string` | `''` | Visible error text below the input. |
| `disabled` | `disabled` | `boolean` | `false` | Authored disabled state. Effective fieldset disabledness does not rewrite it. |
| `readonly` | `readonly` | `boolean` | `false` | Prevents opening, selection, and clearing while retaining form values. |
| `loading` | `loading` | `boolean` | `false` | Shows a spinner and blocks interaction while retaining form values. |
| `required` | `required` | `boolean` | `false` | Requires both endpoints to be valid. |
| `invalid` | `invalid` | `boolean` | `false` | Visual/ARIA invalid presentation only. Use constraints or `setCustomValidity()` for form validity. |
| `clearable` | `clearable` | `boolean` | `false` | Shows a clear button when either live endpoint is non-empty and interaction is allowed. |
| `min` | `min` | `string` | `''` | Inclusive minimum for both endpoints. Canonical `YYYY-MM-DD` is recommended. |
| `max` | `max` | `string` | `''` | Inclusive maximum for both endpoints. Canonical `YYYY-MM-DD` is recommended. |
| `name` | `name` | `string` | `''` | Base form name. Produces `${name}-start` and `${name}-end`; an empty name submits nothing. |
| `columns` | `columns` | `number` | `1` | Calendar month columns (`1` or `2`). |
| `firstDayOfWeek` | `first-day-of-week` | `number` | `0` | First weekday column (`0` = Sunday, `1` = Monday). |
| `presets` | -- | `DateRangePreset[]` | `[]` | JavaScript-only quick ranges. Endpoints may be `Date` or accepted strings. |
| `showCalendar` | `show-calendar` | `boolean` | `false` | Calendar popup state. |
| `form` | -- | `HTMLFormElement \| null` | `null` | Read-only owning form, including one selected with `form="id"`. |
| `validity` | -- | `ValidityState` | -- | Read-only constraint-validation flags. |
| `validationMessage` | -- | `string` | `''` | Read-only current validation message. |
| `willValidate` | -- | `boolean` | -- | Read-only validation participation state. |
| `labels` | -- | `NodeList \| null` | -- | Read-only labels associated with the host. |

`DateRangeFormat` is `'mm/dd/yyyy' | 'dd/mm/yyyy' | 'yyyy-mm-dd' | 'yyyy/mm/dd' | 'dd-mm-yyyy' | 'mm-dd-yyyy' | 'mmmm dd, yyyy'`.

```typescript
interface DateRangePreset {
  label: string;
  start: Date | string;
  end: Date | string;
}
```

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `focus()` | -- | Focuses the visible input. |
| `blur()` | -- | Removes focus. |
| `clear()` | -- | Clears both live endpoints, then emits clear and change events. |
| `open()` | -- | Opens the calendar when interaction is allowed. |
| `close()` | -- | Closes the calendar and cancels an unfinished calendar selection phase. |
| `selectRange(start, end)` | `Date, Date` | Selects a range and emits change. Reversed `Date` arguments are ordered chronologically for this selection API. |
| `checkValidity()` | -- | Returns current constraint validity. |
| `reportValidity()` | -- | Reports validity and returns the result. |
| `setCustomValidity(message)` | `string` | Sets a custom error; pass `''` to clear it. |

## Events

| Event | Detail | When it fires |
|-------|--------|---------------|
| `daterange-change` | `{ start, end, startDate, endDate, startIso, endIso, dateRangePicker }` | Calendar completion, preset/API selection, or clear. ISO fields are canonical local dates. |
| `daterange-preset` | `{ label, start, end, dateRangePicker }` | A preset is selected, after the range change. |
| `daterange-clear` | `{ dateRangePicker }` | The range is cleared, before the change event. |
| `daterange-open` | `{ dateRangePicker }` | The calendar opens. |
| `daterange-close` | `{ dateRangePicker }` | The calendar closes. |
| `daterange-focus` | `{ dateRangePicker }` | The visible input receives focus. |
| `daterange-blur` | `{ dateRangePicker }` | The visible input loses focus. |

All component events bubble and cross the shadow boundary. Direct property/default assignments, form reset, and browser state restoration are silent.

## CSS Parts

| Part | Description |
|------|-------------|
| `input` | Read-only visible range input. |
| `calendar-toggle` | Calendar button. |
| `clear` | Clear button. |
| `spinner` | Loading spinner. |
| `calendar` | Calendar popup. |
| `helper-text` | Helper text. |
| `error-text` | Error text. |

## Basic Usage

```typescript
import 'snice/components/date-range-picker/snice-date-range-picker';
```

```html
<snice-date-range-picker
  label="Booking dates"
  columns="2"
  clearable
></snice-date-range-picker>
```

For CDN use, load the runtime followed by the component bundle:

```html
<script src="snice-runtime.min.js"></script>
<script src="snice-date-range-picker.min.js"></script>
```

## Live Values and Reset Defaults

The picker separates current range state from authored defaults:

- `picker.start` and `picker.end` are live strings. They retain the accepted string assigned by the application or produced by calendar selection.
- `picker.defaultStart`/`picker.defaultEnd` correspond to the `start`/`end` content attributes and are restored by `form.reset()`.
- Assigning either live property makes the range dirty without changing either content attribute.
- Changing an authored default updates live state only while the range remains pristine.
- Selecting, clearing, assigning, or restoring browser state makes the live range dirty.
- Reset restores both current defaults and is silent.
- Changing `format` changes display only. Already parsed endpoints remain valid even if their live strings use the previous format.

```html
<form id="booking-form">
  <snice-date-range-picker
    id="booking-range"
    start="2026-03-10"
    end="2026-03-20"
    format="dd/mm/yyyy"
  ></snice-date-range-picker>
  <button type="reset">Restore authored range</button>
</form>
```

```typescript
bookingRange.start;                       // '2026-03-10'
bookingRange.end;                         // '2026-03-20'
bookingRange.defaultStart;                // '2026-03-10'
bookingRange.shadowRoot.querySelector('input').value;
// '10/03/2026  —  20/03/2026'

bookingRange.start = '12/03/2026';
bookingRange.getAttribute('start');       // '2026-03-10'
bookingForm.reset();
bookingRange.start;                       // '2026-03-10'
```

## Canonical Form Submission

The host is a listed, form-associated custom element. The existing two-field shape is stable: a picker named `booking` contributes `booking-start` and `booking-end`. Both submitted values are canonical `YYYY-MM-DD`, regardless of `format` or the strings held by the live properties.

```html
<form id="trip-form">
  <snice-date-range-picker
    name="booking"
    start="10/03/2026"
    end="20/03/2026"
    format="dd/mm/yyyy"
    required
  ></snice-date-range-picker>
</form>
```

```typescript
Array.from(new FormData(tripForm).entries());
// [
//   ['booking-start', '2026-03-10'],
//   ['booking-end', '2026-03-20']
// ]
```

Successful-control rules:

- A named enabled picker always contributes both fields; empty or unparseable endpoints contribute `''` rather than malformed date text.
- Validation can block interactive form submission even though `new FormData(form)` exposes the current endpoint pair.
- `disabled` and descendants of a disabled fieldset are omitted and barred from validation.
- A picker inside the first `<legend>` of a disabled fieldset remains enabled, matching native form rules.
- `readonly` retains both values and is barred from validation.
- `loading` blocks interaction, retains both values, and is barred from validation.
- An empty `name` contributes no fields.
- `form="form-id"` associates a picker outside a form with that form owner.
- Session-history/autofill restoration preserves both live endpoint strings without emitting customer events.

## Labels and Descriptions

Although the value submits as two canonical endpoints, the visible UI is one range field. Explicit, wrapping, and multiple external labels therefore give the input one combined group name; they do not create ambiguous start/end fields.

```html
<label for="booking-window">Booking dates</label>
<label for="booking-window">required</label>
<snice-date-range-picker
  id="booking-window"
  name="booking"
  helper-text="Choose check-in and check-out."
  required
></snice-date-range-picker>
```

`labels` is live and returned in document order. External label text and association changes—including `for`, host `id`, DOM moves, insertion, removal, and reconnect—update the input name. External labels take precedence; the fallback order is `label`, then `Date range`. Clicking an internal or associated external label focuses the range field without opening the calendar, and disabled controls remain inert.

Helper or error content is referenced exactly once with `aria-describedby`; error text replaces helper text and uses `role="alert"`. `invalid` mirrors to `aria-invalid` but remains separate from native validity. The popup is named `<range name> calendar`, keeping its date and navigation buttons distinct from the field itself.

## Validation

The component exposes `validity`, `validationMessage`, `willValidate`, `checkValidity()`, `reportValidity()`, and `setCustomValidity()` on the host.

- An optional completely empty range is valid.
- `required` sets `valueMissing` until both endpoints are valid.
- A missing endpoint or an unparseable non-empty endpoint sets `badInput`.
- Directly authored or assigned reversed endpoints set `customError`; neither endpoint is silently reordered.
- `selectRange(startDate, endDate)` retains its existing convenience behavior and orders reversed `Date` arguments before selecting.
- Invalid `Date` arguments or presets are ignored atomically; they do not replace the current range or emit selection events.
- `min` and `max` apply inclusively to both endpoints and set `rangeUnderflow`/`rangeOverflow`.
- Calendar days outside the constraints are disabled; boundary days remain selectable.
- Canonical constraints are recommended. Strings in the configured display format remain accepted for compatibility.
- `setCustomValidity('message')` sets `customError`; call `setCustomValidity('')` to clear it.
- `invalid` and `errorText` control presentation only.

```typescript
const range = document.querySelector('snice-date-range-picker');

range.setCustomValidity('Those dates are unavailable.');
range.reportValidity();

range.setCustomValidity('');
range.checkValidity();
```

## Formats and Presets

All seven formats control presentation while the form pair remains canonical:

```html
<snice-date-range-picker start="2026-03-10" end="2026-03-20" format="mm/dd/yyyy"></snice-date-range-picker>
<!-- 03/10/2026 — 03/20/2026 -->

<snice-date-range-picker start="2026-03-10" end="2026-03-20" format="dd/mm/yyyy"></snice-date-range-picker>
<!-- 10/03/2026 — 20/03/2026 -->

<snice-date-range-picker start="2026-03-10" end="2026-03-20" format="mmmm dd, yyyy"></snice-date-range-picker>
<!-- March 10, 2026 — March 20, 2026 -->
```

Numeric formats retain `/` and `-` separator compatibility at the assignment boundary. Presets are a JavaScript property and accept `Date` objects or strings accepted by the current format:

```typescript
range.presets = [
  { label: 'March week', start: '2026-03-05', end: '2026-03-11' },
  { label: 'Late March', start: new Date(2026, 2, 21), end: new Date(2026, 2, 28) }
];
```

Hovering a preset previews its chronological range without mutating the preset. Selecting it updates both endpoints, emits `daterange-change` followed by `daterange-preset`, and closes the calendar.

## Examples

### Min, Max, and Dual Columns

```html
<snice-date-range-picker
  name="vacation"
  min="2026-03-01"
  max="2026-03-31"
  columns="2"
  clearable
  required
  label="Vacation dates"
></snice-date-range-picker>
```

### Variants and Sizes

```html
<snice-date-range-picker variant="outlined" size="small" label="Small"></snice-date-range-picker>
<snice-date-range-picker variant="filled" size="medium" label="Medium"></snice-date-range-picker>
<snice-date-range-picker variant="underlined" size="large" label="Large"></snice-date-range-picker>
```

### States

```html
<snice-date-range-picker disabled start="2026-03-10" end="2026-03-20"></snice-date-range-picker>
<snice-date-range-picker readonly start="2026-03-10" end="2026-03-20"></snice-date-range-picker>
<snice-date-range-picker loading start="2026-03-10" end="2026-03-20"></snice-date-range-picker>
<snice-date-range-picker invalid error-text="Review this range"></snice-date-range-picker>
```

### Event Handling

```typescript
range.addEventListener('daterange-change', event => {
  console.log(event.detail.start, event.detail.end);       // live strings
  console.log(event.detail.startIso, event.detail.endIso); // canonical dates
});
```

## Keyboard Navigation

- Tab and Shift+Tab reach the visible range input and surrounding form controls.
- Enter or Space on the range input opens the calendar.
- Escape closes an open calendar and returns focus to the input.
- Calendar days, month navigation, year navigation, preset choices, and Today are real buttons.

## Accessibility

- The host participates in native form ownership, reset, disabled-fieldset, restoration, and constraint-validation lifecycles.
- The calendar uses `popover="manual"` for top-layer placement where supported.
- The popup flips or clamps to the viewport, scrolls internally when its full contents cannot fit, and repositions on page scroll or resize.
- Navigation buttons and date buttons provide accessible labels; constrained dates are disabled.
- The visible input mirrors required, effective disabledness, loading, and `aria-invalid` presentation.
- Explicit, wrapping, and multiple labels provide one live name for the complete range and focus it without opening the popup.
- Helper/error content is described once; the named calendar group remains separate from the range field.
- `form`, `labels`, `validity`, `validationMessage`, and `willValidate` expose native relationships on the host.

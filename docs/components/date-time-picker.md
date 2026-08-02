<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/date-time-picker.md -->

# Date Time Picker

`<snice-date-time-picker>` combines an editable local date-time field, calendar, and time selectors. It is a form-associated custom element with native reset, disabled-fieldset, state-restoration, and constraint-validation behavior.

## Table of Contents

- [Basic usage](#basic-usage)
- [Local datetime contract](#local-datetime-contract)
- [Input and display](#input-and-display)
- [Labels and composite names](#labels-and-composite-names)
- [Validation](#validation)
- [Disabled, readonly, and loading states](#disabled-readonly-and-loading-states)
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [CSS parts](#css-parts)
- [Accessibility](#accessibility)

## Basic usage

```typescript
import 'snice/components/date-time-picker/snice-date-time-picker';
```

```html
<form>
  <snice-date-time-picker
    name="appointment"
    label="Appointment"
    value="2026-03-10T14:05"
    required
  ></snice-date-time-picker>
</form>
```

CDN:

```html
<script src="snice-runtime.min.js"></script>
<script src="snice-date-time-picker.min.js"></script>
```

## Local datetime contract

The picker represents a local wall-clock date and time. It has no time zone and does not convert to UTC or apply an offset.

- Without `show-seconds`, the successful form value is exactly `YYYY-MM-DDTHH:mm`.
- With `show-seconds`, the successful form value is exactly `YYYY-MM-DDTHH:mm:ss`.
- Display settings do not change that canonical form.
- A malformed or partial field remains visible and invalid, but is never submitted as though it were a valid datetime.
- Calendar fields, hours, minutes, and optional seconds are checked independently and strictly. Impossible dates and time overflows are never normalized.
- DST gaps and repeated wall times remain the local values the customer entered; the picker does not silently shift them.

```html
<form id="schedule-form">
  <snice-date-time-picker
    name="scheduled-at"
    value="2026-03-08T02:30"
    date-format="mm/dd/yyyy"
    time-format="12h"
  ></snice-date-time-picker>
</form>

<script>
  new FormData(document.querySelector('#schedule-form')).get('scheduled-at');
  // "2026-03-08T02:30"
</script>
```

### Live value and reset default

The API follows the native live/default split:

- `value` is the current live value.
- `defaultValue` is the reset default represented by the `value` content attribute.
- Assigning `picker.value` does not rewrite the attribute or reset default.
- Changing the `value` attribute updates the live value only while the field is pristine.
- `form.reset()` restores the latest authored default without firing customer change events.

```typescript
const picker = document.querySelector('snice-date-time-picker');

picker.value = '2026-04-20T16:25';       // live state
picker.defaultValue = '2026-05-30T08:15'; // reset state / value attribute

picker.form?.reset();
console.log(picker.value); // "2026-05-30T08:15"
```

The form-state restoration callback preserves exact visible text, including partial input, while recalculating its canonical value and validity. Non-string restoration states are ignored.

## Input and display

The text field is editable. Calendar and time selectors update the same live value. `dateFormat` and `timeFormat` affect presentation and keyboard parsing only; changing either setting never rewrites the live value or authored default.

## Labels and composite names

Explicit `<label for>`, wrapping labels, and multiple labels are supported. `labels` returns the live associated labels in document order. Text edits and changes to `for`, the host `id`, surrounding DOM, and connection state update naming without rebuilding the component.

```html
<label for="appointment">Appointment</label>
<label for="appointment">required</label>
<snice-date-time-picker
  id="appointment"
  name="appointment"
  helper-text="Times are displayed locally."
  required
></snice-date-time-picker>
```

External labels are combined and take precedence. The fallback order is the `label` property, then `Date and time`. In dropdown mode, label activation focuses the editable field without opening the panel. In `variant="inline"`, it focuses the named composite group. Disabled controls remain inert.

The dropdown/inline panel is named `<control name> controls`; its calendar is `<control name> date`, and hours, minutes, optional seconds, and period each have a distinct group name. Calendar day buttons use formatted date names. This keeps repeated numeric buttons understandable without pretending the component is several unrelated form fields.

Helper/error content is connected once with `aria-describedby`; error text replaces helper text, uses `role="alert"`, and `invalid` mirrors to `aria-invalid`. Visual error properties remain separate from constraint validity.

Supported date formats:

- `yyyy-mm-dd`
- `mm/dd/yyyy`
- `dd/mm/yyyy`
- `yyyy/mm/dd`
- `dd-mm-yyyy`
- `mm-dd-yyyy`
- `mmmm dd, yyyy`

Supported time formats are `24h` and `12h`. Set `show-seconds` to display, edit, select, and submit second precision.

```html
<snice-date-time-picker
  date-format="mmmm dd, yyyy"
  time-format="12h"
  show-seconds
  value="2026-12-25T14:30:45"
  label="Event start"
></snice-date-time-picker>
```

## Validation

The host exposes `validity`, `validationMessage`, `willValidate`, `checkValidity()`, `reportValidity()`, and `setCustomValidity()`.

| Condition | Validity flag |
|---|---|
| Required and empty | `valueMissing` |
| Partial, malformed, impossible date, or invalid time | `badInput` |
| Earlier than `min` | `rangeUnderflow` |
| Later than `max` | `rangeOverflow` |
| Non-empty custom message | `customError` |

`min` and `max` accept either a canonical local datetime or a date-only `YYYY-MM-DD` boundary. Date-only `min` means the start of that day; date-only `max` includes the complete day. An impossible constraint is ignored rather than rolled into a different datetime.

```html
<snice-date-time-picker
  name="appointment"
  min="2026-03-10T09:30"
  max="2026-03-20T17:45"
  required
></snice-date-time-picker>
```

```typescript
picker.setCustomValidity('No appointments remain for this day.');
picker.reportValidity();
picker.setCustomValidity('');
```

The `invalid` property remains an authored visual state. Native constraint failures also apply invalid styling and `aria-invalid` automatically.

## Disabled, readonly, and loading states

- `disabled` and disabled ancestor fieldsets suppress every user interaction, omit the control from `FormData`, and bar validation.
- A control in the first `<legend>` of a disabled fieldset follows the native legend exception.
- Inherited fieldset disabledness never overwrites the public `disabled` property or attribute.
- `readonly` prevents editing and picker interaction, remains successful in `FormData`, and is barred from validation.
- `loading` shows the spinner, prevents interaction, preserves the form value, and is barred from validation.
- Disabling an open dropdown closes it.

```html
<fieldset disabled>
  <legend>
    Schedule
    <snice-date-time-picker name="legend-time"></snice-date-time-picker>
  </legend>
  <snice-date-time-picker name="disabled-time"></snice-date-time-picker>
</fieldset>
```

## Properties

| Property | Attribute | Type | Default | Description |
|---|---|---|---|---|
| `value` | — | `string` | `''` | Current live local datetime or current malformed/partial text |
| `defaultValue` | `value` | `string` | `''` | Authored form-reset default |
| `dateFormat` | `date-format` | `DateTimePickerDateFormat` | `'yyyy-mm-dd'` | Date display and keyboard-input format |
| `timeFormat` | `time-format` | `'12h' \| '24h'` | `'24h'` | Time display and keyboard-input format |
| `size` | `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Field size |
| `min` | `min` | `string` | `''` | Inclusive minimum date or local datetime |
| `max` | `max` | `string` | `''` | Inclusive maximum date or local datetime |
| `showSeconds` | `show-seconds` | `boolean` | `false` | Enables second precision |
| `loading` | `loading` | `boolean` | `false` | Shows loading state and blocks interaction |
| `clearable` | `clearable` | `boolean` | `false` | Shows a clear button for non-empty input |
| `disabled` | `disabled` | `boolean` | `false` | Authored disabled state |
| `readonly` | `readonly` | `boolean` | `false` | Prevents customer changes |
| `placeholder` | `placeholder` | `string` | `''` | Custom placeholder |
| `label` | `label` | `string` | `''` | Internal label text |
| `helperText` | `helper-text` | `string` | `''` | Guidance below the field |
| `errorText` | `error-text` | `string` | `''` | Error text below the field |
| `required` | `required` | `boolean` | `false` | Requires a complete valid local datetime |
| `invalid` | `invalid` | `boolean` | `false` | Authored invalid presentation |
| `name` | `name` | `string` | `''` | Successful-control name |
| `variant` | `variant` | `'dropdown' \| 'inline'` | `'dropdown'` | Popup or always-visible picker |

Read-only native form properties:

| Property | Type | Description |
|---|---|---|
| `type` | `'datetime-local'` | Native-compatible control type |
| `form` | `HTMLFormElement \| null` | Current form owner, including `form="id"` association |
| `validity` | `ValidityState` | Current constraint state |
| `validationMessage` | `string` | Current validation message |
| `willValidate` | `boolean` | Whether constraint validation applies |
| `labels` | `NodeList \| null` | Labels associated with the host |

## Methods

| Method | Description |
|---|---|
| `open()` | Opens the dropdown when interaction is allowed |
| `close()` | Closes the dropdown |
| `clear()` | Clears live state and emits the existing clear/change events |
| `focus()` | Focuses the editable field |
| `blur()` | Blurs the editable field |
| `checkValidity()` | Recalculates and returns current validity |
| `reportValidity()` | Recalculates and reports current validity |
| `setCustomValidity(message)` | Sets or clears a custom error |

## Events

| Event | Detail | Description |
|---|---|---|
| `datetime-change` | `{ value, date, dateString, timeString, iso, dateTimePicker }` | Date or time changed through the field or picker |
| `datetimepicker-focus` | `{ dateTimePicker }` | Field focused |
| `datetimepicker-blur` | `{ dateTimePicker }` | Field blurred |
| `datetimepicker-open` | `{ dateTimePicker }` | Dropdown opened |
| `datetimepicker-close` | `{ dateTimePicker }` | Dropdown closed |
| `datetimepicker-clear` | `{ dateTimePicker }` | Live state cleared |

Reset and browser state restoration do not emit customer change events.

## CSS parts

`base`, `label`, `input`, `toggle`, `panel`, `calendar`, `time`, `clear`, `spinner`, `helper-text`, `error-text`

The dropdown uses the top-layer Popover API when available. It flips and clamps to the viewport, constrains its width and height, and scrolls internally on narrow or short screens. The inline variant keeps the full calendar and time selectors in document flow.

## Accessibility

- The host participates in native forms through `ElementInternals`.
- Required and calculated invalid state are exposed on the editable field.
- The toggle and clear controls have accessible names.
- Disabled and readonly states block all picker buttons, including inline controls.
- The first-legend disabled-fieldset exception follows native form behavior.
- Helper and error text remain available as separate CSS parts for application-specific presentation.
- External labels are live, focus the intended dropdown or inline target, and never open unrelated UI.
- The panel, calendar, and time columns have distinct names derived from the control name.
- Helper/error text is referenced exactly once; errors replace helper text and are exposed as alerts.

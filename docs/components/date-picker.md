<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/date-picker.md -->

# Date Picker Component

`<snice-date-picker>` is a calendar-backed text date control with configurable display formats and native form behavior. Its live and submitted value is always a stable calendar date (`YYYY-MM-DD`); `format` changes only what people see and type.

## Table of Contents

- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Value, Display, and Reset Defaults](#value-display-and-reset-defaults)
- [Form Integration](#form-integration)
- [Labels and Descriptions](#labels-and-descriptions)
- [Validation](#validation)
- [Date Formats](#date-formats)
- [Examples](#examples)
- [Keyboard and Accessibility](#keyboard-and-accessibility)

## Properties

| Property | Attribute | Type | Default | Description |
|----------|-----------|------|---------|-------------|
| `value` | -- | `string` | `''` | Live canonical date (`YYYY-MM-DD`), or `''` when there is no complete valid date. Assignments are silent and do not rewrite the reset default. |
| `defaultValue` | `value` | `string` | `''` | Authored value and form-reset default. Canonical dates are recommended. |
| `format` | `format` | `DateFormat` | `'mm/dd/yyyy'` | Visible display and manual-input format. It never changes the canonical live value. |
| `variant` | `variant` | `'outlined' \| 'filled' \| 'underlined'` | `'outlined'` | Input visual style. |
| `size` | `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Component size. |
| `placeholder` | `placeholder` | `string` | format hint | Explicit placeholder. When empty, the current format supplies a hint. |
| `label` | `label` | `string` | `''` | Visible label text. |
| `helperText` | `helper-text` | `string` | `''` | Supporting text below the input. |
| `errorText` | `error-text` | `string` | `''` | Visible error text below the input. |
| `disabled` | `disabled` | `boolean` | `false` | Authored disabled state. Effective fieldset disabledness does not rewrite it. |
| `readonly` | `readonly` | `boolean` | `false` | Prevents editing and opening while retaining the form value. |
| `loading` | `loading` | `boolean` | `false` | Shows a spinner and blocks interaction without removing the value from form submission or validation. |
| `required` | `required` | `boolean` | `false` | Requires a complete valid date. |
| `invalid` | `invalid` | `boolean` | `false` | Visual/ARIA invalid presentation only. Use constraints or `setCustomValidity()` for form validity. |
| `clearable` | `clearable` | `boolean` | `false` | Shows a clear button whenever editable text is present. |
| `min` | `min` | `string` | `''` | Inclusive minimum date. Use canonical `YYYY-MM-DD`. |
| `max` | `max` | `string` | `''` | Inclusive maximum date. Use canonical `YYYY-MM-DD`. |
| `name` | `name` | `string` | `''` | Form field name. An empty name is not submitted. |
| `open` | `open` | `boolean` | `false` | Calendar popup state. |
| `firstDayOfWeek` | `first-day-of-week` | `number` | `0` | Weekday column that appears first (`0` = Sunday, `1` = Monday). |
| `type` | -- | `'date'` | `'date'` | Read-only native-compatible control type. |
| `form` | -- | `HTMLFormElement \| null` | `null` | Read-only owning form, including a form selected with `form="id"`. |
| `validity` | -- | `ValidityState` | -- | Read-only constraint-validation flags. |
| `validationMessage` | -- | `string` | `''` | Read-only current validation message. |
| `willValidate` | -- | `boolean` | -- | Read-only validation participation state. |
| `labels` | -- | `NodeList \| null` | -- | Read-only labels associated with the host. |

`DateFormat` is `'mm/dd/yyyy' | 'dd/mm/yyyy' | 'yyyy-mm-dd' | 'yyyy/mm/dd' | 'dd-mm-yyyy' | 'mm-dd-yyyy' | 'mmmm dd, yyyy'`.

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `focus()` | -- | Focuses the text input. |
| `blur()` | -- | Removes focus. |
| `clear()` | -- | Clears live text/value, then emits clear and change events. |
| `show()` | -- | Opens the calendar when interaction is allowed. |
| `hide()` | -- | Closes the calendar. |
| `selectDate(date)` | `Date` | Selects a valid local calendar date. |
| `goToMonth(year, month)` | `number, number` | Changes the visible calendar month (`month` is zero-based). |
| `goToToday()` | -- | Selects today's local calendar date. |
| `checkValidity()` | -- | Returns current constraint validity. |
| `reportValidity()` | -- | Reports validity and returns the result. |
| `setCustomValidity(message)` | `string` | Sets a custom error; pass `''` to clear it. |

## Events

| Event | Detail | When it fires |
|-------|--------|---------------|
| `datepicker-input` | `{ value, datePicker }` | Each manual text input. `value` is canonical when complete and valid, otherwise `''`. |
| `datepicker-change` | `{ value, date, formatted, iso, datePicker }` | Manual change, clear, calendar selection, or `selectDate()`. `value` and `iso` are canonical. |
| `datepicker-select` | `{ date, formatted, iso, datePicker }` | A date is selected from the calendar or selection API. |
| `datepicker-clear` | `{ datePicker }` | The control is cleared. |
| `datepicker-focus` | `{ datePicker }` | The text input receives focus. |
| `datepicker-blur` | `{ datePicker }` | The text input loses focus. |
| `datepicker-open` | `{ datePicker }` | The calendar opens. |
| `datepicker-close` | `{ datePicker }` | The calendar closes. |

All component events bubble and cross the shadow boundary. Direct `value`/`defaultValue` assignments, form reset, and browser state restoration are silent.

## CSS Parts

| Part | Description |
|------|-------------|
| `input` | Text input. |
| `calendar-toggle` | Calendar button. |
| `clear` | Clear button. |
| `spinner` | Loading spinner. |
| `calendar` | Calendar popup. |
| `helper-text` | Helper text. |
| `error-text` | Error text. |

## Basic Usage

```typescript
import 'snice/components/date-picker/snice-date-picker';
```

```html
<snice-date-picker label="Delivery date" clearable></snice-date-picker>
```

For CDN use, load the runtime followed by the component bundle:

```html
<script src="snice-runtime.min.js"></script>
<script src="snice-date-picker.min.js"></script>
```

## Value, Display, and Reset Defaults

The date picker deliberately separates machine data from presentation:

- `picker.value` is current live state and is always `YYYY-MM-DD` or `''`.
- `picker.defaultValue` and the `value` content attribute are the authored reset default.
- `picker.format` controls displayed/manual text, not the submitted value.
- Assigning either a canonical value or a valid string in the configured format is supported. Numeric input retains compatibility with `/` and `-` separators and is normalized for display.
- An impossible or malformed programmatic assignment is sanitized to `''`, like a native date input.
- Partial or invalid user text remains visible so it can be corrected, while `value` becomes `''` and `validity.badInput` becomes true.

```html
<form id="schedule">
  <snice-date-picker
    id="delivery"
    name="delivery-date"
    value="2026-03-15"
    format="dd/mm/yyyy"
  ></snice-date-picker>
  <button type="reset">Restore authored date</button>
</form>
```

```typescript
delivery.value;                       // '2026-03-15'
delivery.defaultValue;                // '2026-03-15'
delivery.shadowRoot.querySelector('input').value; // '15/03/2026'

delivery.value = '20/03/2026';        // accepted at the configured-format boundary
delivery.value;                       // '2026-03-20'
delivery.getAttribute('value');       // '2026-03-15' (reset default is unchanged)

schedule.reset();
delivery.value;                       // '2026-03-15'
```

Changing `defaultValue` updates live state only until the live value becomes dirty. Setting `value`, typing, selecting, clearing, or restoring browser state makes it dirty. A form reset clears that dirty state and restores the current `defaultValue` without emitting component events.

## Form Integration

The host is a listed, form-associated custom element. It works with `FormData`, `form.elements`, `checkValidity()`, reset, session-history/autofill restoration, disabled fieldsets, and explicit `form="id"` ownership.

```html
<form id="booking">
  <snice-date-picker
    name="arrival"
    value="2026-03-15"
    format="mmmm dd, yyyy"
    required
  ></snice-date-picker>
  <button type="submit">Book</button>
  <button type="reset">Reset</button>
</form>
```

```typescript
Array.from(new FormData(booking).entries());
// [['arrival', '2026-03-15']]
```

Successful-control rules:

- An enabled picker with a non-empty `name` contributes its canonical value to `FormData`.
- A named empty/invalid picker contributes `''`; validation can still block an invalid form submission.
- `disabled` and effectively disabled fieldset descendants are omitted and barred from validation.
- A control inside the first `<legend>` of a disabled fieldset remains enabled, matching native form rules.
- `readonly` retains its value in `FormData` and is barred from constraint validation.
- `loading` blocks interaction but retains its form value and validation participation.
- An empty `name` is not submitted.
- `form="form-id"` associates a picker outside the form with that form owner.

Browser restoration preserves exact visible text. A complete restored string recreates its canonical value; partial/invalid restored text remains visible and invalid. Application code should not call lifecycle callbacks directly.

## Labels and Descriptions

The picker supports the same external label shapes as a native form control: an explicit `<label for="arrival">`, a wrapping `<label>`, and multiple labels. `labels` returns the currently associated labels in document order. Label text, `for`, the picker `id`, DOM moves, and label insertion/removal remain live after connection and reconnect.

```html
<label for="arrival">Arrival date</label>
<label for="arrival">required</label>
<snice-date-picker
  id="arrival"
  name="arrival"
  helper-text="Use the destination's local date."
  required
></snice-date-picker>
```

External labels are combined in document order and take naming precedence. With no associated external label, the accessible name falls back to the `label` property and then `Date`. Clicking an external or internal label focuses the text field without opening the calendar. Disabled pickers remain inert.

The visible field references exactly one live description. Error content replaces helper content in that description and uses `role="alert"`; the corresponding properties are `errorText` and `helperText`. `invalid` mirrors to `aria-invalid`. These presentation properties do not themselves change native constraint validity. The popup is a separately named `<control name> calendar` group, so its navigation never becomes part of the field name.

## Validation

The component exposes the native-style `validity`, `validationMessage`, `willValidate`, `checkValidity()`, `reportValidity()`, and `setCustomValidity()` API.

- `required` sets `validity.valueMissing` when no complete valid date exists.
- Partial or impossible manual text sets `validity.badInput` and never masquerades as a date value.
- Canonical `min`/`max` set `rangeUnderflow`/`rangeOverflow` and disable out-of-range calendar days. Boundary dates remain allowed.
- For compatibility, constraints written in the configured display format are accepted too; canonical constraints are clearer and are recommended.
- Malformed `min`/`max` constraints are ignored.
- `setCustomValidity('message')` sets `customError`; call `setCustomValidity('')` to clear it.
- `invalid` and `errorText` control presentation only. They do not by themselves invalidate a form.
- `disabled`, effective fieldset disabledness, and `readonly` are barred from validation. `loading` is not.

```typescript
const picker = document.querySelector('snice-date-picker');

picker.setCustomValidity('That date is unavailable.');
picker.reportValidity();

picker.setCustomValidity('');
picker.checkValidity();
```

## Date Formats

All formats display the same canonical value differently:

```html
<snice-date-picker value="2026-03-06" format="mm/dd/yyyy"></snice-date-picker>
<!-- 03/06/2026 -->

<snice-date-picker value="2026-03-06" format="dd/mm/yyyy"></snice-date-picker>
<!-- 06/03/2026 -->

<snice-date-picker value="2026-03-06" format="yyyy/mm/dd"></snice-date-picker>
<!-- 2026/03/06 -->

<snice-date-picker value="2026-03-06" format="mmmm dd, yyyy"></snice-date-picker>
<!-- March 06, 2026 -->
```

Dates are checked strictly, including month lengths and leap years; values such as `2026-02-29` and `2026-04-31` are rejected rather than rolled into another month. Calendar conversion uses local date fields, so a value does not shift a day because of timezone conversion.

## Examples

### Min, Max, and Clear

```html
<snice-date-picker
  name="appointment"
  value="2026-03-15"
  min="2026-03-10"
  max="2026-03-20"
  clearable
  required
  label="Appointment date"
></snice-date-picker>
```

### Variants and Sizes

```html
<snice-date-picker variant="outlined" size="small" label="Small"></snice-date-picker>
<snice-date-picker variant="filled" size="medium" label="Medium"></snice-date-picker>
<snice-date-picker variant="underlined" size="large" label="Large"></snice-date-picker>
```

### States

```html
<snice-date-picker disabled value="2026-03-15" label="Disabled"></snice-date-picker>
<snice-date-picker readonly value="2026-03-15" label="Readonly"></snice-date-picker>
<snice-date-picker loading value="2026-03-15" label="Loading"></snice-date-picker>
<snice-date-picker invalid error-text="Review this date" label="Visual error"></snice-date-picker>
```

### Event Handling

```typescript
picker.addEventListener('datepicker-input', event => {
  console.log(event.detail.value); // canonical or '' while incomplete
});

picker.addEventListener('datepicker-change', event => {
  console.log(event.detail.value);     // '2026-03-20'
  console.log(event.detail.formatted); // '20/03/2026', depending on format
  console.log(event.detail.iso);       // '2026-03-20'
});
```

## Keyboard and Accessibility

- Tab and Shift+Tab reach the editable text input and calendar controls.
- Enter or Space on the text input opens the calendar.
- Escape on the text input closes an open calendar and returns focus.
- Calendar days are real buttons with formatted `aria-label` values; constrained dates are disabled buttons.
- The calendar uses `popover="manual"` for top-layer placement where supported.
- The text input mirrors required, disabled, readonly, loading, and `aria-invalid` state.
- Explicit, wrapping, and multiple external labels name and focus the text field; association and text changes are live.
- Helper/error text is connected with `aria-describedby` once, and the error replaces rather than duplicates helper text.
- `form`, `labels`, `validity`, `validationMessage`, and `willValidate` expose the host's native form/accessibility relationship.

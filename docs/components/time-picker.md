<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/time-picker.md -->

# Time Picker

`<snice-time-picker>` is an editable, form-associated time control with 12-hour and 24-hour displays, dropdown or inline selectors, optional seconds, range and step constraints, native reset and restoration, and constraint validation.

## Basic usage

```ts
import 'snice/components/time-picker/snice-time-picker';
```

```html
<form>
  <snice-time-picker
    name="appointment"
    label="Appointment"
    value="14:05:10"
    format="12h"
    step="5"
    min-time="09:00:00"
    max-time="17:00:00"
    show-seconds
    clearable
    required
  ></snice-time-picker>
  <button type="submit">Schedule</button>
  <button type="reset">Reset</button>
</form>
```

## Time and form-value contract

The picker displays time according to `format`, but form submission is always a canonical 24-hour local time:

- `HH:mm` while `showSeconds` is false.
- `HH:mm:ss` while `showSeconds` is true.
- No date, time zone, UTC conversion, or locale-dependent text is submitted.
- Malformed or partial text remains visible for correction, sets `badInput`, and contributes an empty value rather than submitting malformed text as a valid time.

For example, a 12-hour display of `2:05:10 PM` contributes `14:05:10` to `FormData` when seconds are enabled.

```ts
const form = document.querySelector('form')!;
console.log(new FormData(form).get('appointment')); // "14:05:10"
```

Programmatic canonical values use zero-padded `HH:mm` or `HH:mm:ss`. Keyboard input follows the active display: `14:05` in 24-hour mode, or `2:05 PM` in 12-hour mode. With `showSeconds`, the displayed seconds are required, such as `14:05:10` or `2:05:10 PM`.

## Live value and reset default

`value` and `defaultValue` intentionally represent different state:

- `value` is the live value. Property assignment, keyboard input, selector changes, clearing, and browser state restoration update it.
- `defaultValue` reflects the `value` content attribute. It is the authored default returned to by `form.reset()`.
- Changing the `value` attribute updates a pristine picker. After the live value becomes dirty, changing the attribute changes only `defaultValue` until reset.
- Changing `format` or `showSeconds` changes presentation and submitted precision without rewriting the authored reset default.
- Reset and browser state restoration do not dispatch user-change events.

```ts
const picker = document.querySelector('snice-time-picker')!;

picker.value = '16:25';               // live value only
picker.setAttribute('value', '08:15'); // new reset default
picker.form?.reset();                  // value returns to "08:15"
```

The browser restoration state preserves the exact visible text. A valid restored display is converted back to canonical `value`; partial restored text remains visible and invalid so the user can continue editing it.

## Native form lifecycle

The component is a form-associated custom element. With a `name`, it appears in `form.elements` and `FormData`, supports an explicit `form="id"` owner, and exposes native-compatible `form`, `labels`, `validity`, `validationMessage`, and `willValidate` properties.

It implements the complete lifecycle:

- `form.reset()` restores `defaultValue` and the corresponding display.
- A disabled ancestor `fieldset` disables the internal input, toggle, clear button, and every selector without changing the authored `disabled` property.
- The normal first-`legend` exception for disabled fieldsets is preserved by the browser.
- Authored or inherited disabled controls are omitted from `FormData`.
- `readonly` blocks editing and validation but preserves the successful form value, like a native readonly control.
- `loading` blocks interaction and validation without discarding the current form value.
- Disconnecting and reconnecting preserves the live value, form ownership, and outside-click behavior.

## Validation

The picker participates in `form.checkValidity()`, `form.reportValidity()`, `:valid`, and `:invalid`. Its `ValidityState` uses:

- `valueMissing` when `required` and empty.
- `badInput` for non-empty partial, malformed, impossible, or wrong-format text.
- `rangeUnderflow` when the time is earlier than `min-time`.
- `rangeOverflow` when the time is later than `max-time`.
- `stepMismatch` when minutes do not align to `step`; when seconds are shown, seconds must align as well.
- `customError` after `setCustomValidity(message)` with a non-empty message.

`min-time` and `max-time` accept canonical `HH:mm` or `HH:mm:ss` and compare exact wall-clock boundaries. Invalid constraint strings are ignored. Supported `step` values are `1`, `5`, `10`, `15`, and `30`; the same increment controls the minute selector, the visible seconds selector, and their validity checks. Boundaries are inclusive.

```html
<snice-time-picker
  value="09:30:15"
  min-time="09:30:15"
  max-time="17:45:30"
  step="5"
  show-seconds
></snice-time-picker>
```

The `invalid` property is a presentation override only. It applies invalid styling and `aria-invalid`, but does not create a constraint-validation error. Use constraints or `setCustomValidity()` when form validity must change.

Disabled, disabled-fieldset, readonly, and loading states are barred from validation. Their stored value and custom validation message are retained and apply again when the control becomes eligible.

## Display and interaction

### Formats

```html
<snice-time-picker format="24h" value="14:30" label="24-hour"></snice-time-picker>
<snice-time-picker format="12h" value="14:30" label="12-hour"></snice-time-picker>
```

`format` changes only the editable text and hour/period columns. The live and submitted value remains canonical 24-hour time.

### Seconds and step

```html
<snice-time-picker show-seconds step="1" value="09:15:30"></snice-time-picker>
<snice-time-picker show-seconds step="5" value="09:15:30"></snice-time-picker>
```

When seconds are hidden, valid form values use minute precision. A programmatically assigned canonical value may retain its seconds in `value`, allowing them to reappear if `showSeconds` is enabled later.

### Dropdown and inline

```html
<snice-time-picker variant="dropdown" value="10:00"></snice-time-picker>
<snice-time-picker variant="inline" value="10:00"></snice-time-picker>
```

The dropdown opens from input click, the clock button, `Enter`, or `ArrowDown`; `Escape` closes it. Space remains available for typing 12-hour values. The inline variant keeps the same interactive selectors visible without using a popover.

### Sizes and states

```html
<snice-time-picker size="small"></snice-time-picker>
<snice-time-picker size="medium"></snice-time-picker>
<snice-time-picker size="large"></snice-time-picker>
<snice-time-picker loading></snice-time-picker>
<snice-time-picker disabled value="12:00"></snice-time-picker>
<snice-time-picker readonly value="15:30"></snice-time-picker>
```

`clearable` exposes a clear button only when visible text exists and the user may interact. Calling `clear()` is also available as an imperative API.

## Properties

| Property | Attribute | Type | Default | Contract |
|---|---|---|---|---|
| `value` | — | `string` | `''` | Live canonical value, or preserved partial/malformed text. Does not reflect to the reset attribute. |
| `defaultValue` | `value` | `string` | `''` | Authored reset default. |
| `format` | `format` | `'12h' \| '24h'` | `'24h'` | Editable display and selector format. |
| `step` | `step` | `1 \| 5 \| 10 \| 15 \| 30` | `15` | Minute and visible-second increment and alignment. |
| `minTime` | `min-time` | `string` | `''` | Inclusive canonical lower boundary. |
| `maxTime` | `max-time` | `string` | `''` | Inclusive canonical upper boundary. |
| `showSeconds` | `show-seconds` | `boolean` | `false` | Shows seconds and uses second-precision form values. |
| `disabled` | `disabled` | `boolean` | `false` | Disables interaction, validation, and form submission. |
| `readonly` | `readonly` | `boolean` | `false` | Blocks user editing while preserving form submission. |
| `loading` | `loading` | `boolean` | `false` | Shows a spinner and temporarily blocks interaction/validation. |
| `clearable` | `clearable` | `boolean` | `false` | Shows an available clear button for non-empty text. |
| `placeholder` | `placeholder` | `string` | `''` | Custom placeholder; otherwise derived from format/seconds. |
| `label` | `label` | `string` | `''` | Visible label text. |
| `helperText` | `helper-text` | `string` | `''` | Supporting text. |
| `errorText` | `error-text` | `string` | `''` | Error text; takes display precedence over helper text. |
| `required` | `required` | `boolean` | `false` | Enables `valueMissing`. |
| `invalid` | `invalid` | `boolean` | `false` | Visual invalid state only. |
| `name` | `name` | `string` | `''` | Successful-control name. |
| `variant` | `variant` | `'dropdown' \| 'inline'` | `'dropdown'` | Popup or always-visible selectors. |
| `size` | `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Input size. |
| `type` | — | `'time'` | `'time'` | Read-only native-compatible control type. |
| `form` | `form` | `HTMLFormElement \| null` | — | Read-only owning form. |
| `validity` | — | `ValidityState` | — | Read-only current validity flags. |
| `validationMessage` | — | `string` | — | Read-only current validation message. |
| `willValidate` | — | `boolean` | — | Read-only validation eligibility. |
| `labels` | — | `NodeList \| null` | — | Read-only associated labels. |

## Methods

| Method | Description |
|---|---|
| `open()` | Opens the dropdown when interaction is allowed and variant is `dropdown`. |
| `close()` | Closes the dropdown. |
| `clear()` | Clears live text/value and dispatches clear then change events. |
| `focus()` | Focuses the editable input when present. |
| `blur()` | Blurs the editable input when present. |
| `checkValidity()` | Synchronizes constraints and returns current validity. |
| `reportValidity()` | Reports and returns current validity. |
| `setCustomValidity(message)` | Sets or clears `customError`. |

## Events

| Event | Detail | When |
|---|---|---|
| `time-change` | `{ value, hours, minutes, seconds, formatted, timePicker }` | Valid keyboard input, selector changes, and after clearing. |
| `timepicker-clear` | `{ timePicker }` | Immediately before `time-change` when cleared. |
| `timepicker-focus` | `{ timePicker }` | Editable input focus. |
| `timepicker-blur` | `{ timePicker }` | Editable input blur. |
| `timepicker-open` | `{ timePicker }` | Dropdown opening. |
| `timepicker-close` | `{ timePicker }` | Dropdown closing. |

Property assignment, reset, and browser restoration do not synthesize user change events.

## CSS parts

| Part | Element |
|---|---|
| `base` | Wrapper |
| `label` | Visible label |
| `input` | Editable text input |
| `toggle` | Clock toggle |
| `clear` | Clear button |
| `spinner` | Loading spinner |
| `dropdown` | Dropdown or inline selector container |
| `hours` | Hour column |
| `minutes` | Minute column |
| `seconds` | Optional seconds column |
| `period` | Optional AM/PM column |
| `helper-text` | Helper text |
| `error-text` | Error text |

# snice-date-time-picker

Editable local date-time field with calendar and time selectors. Form-associated; never converts to UTC.

## Canonical form value

```text
showSeconds=false -> YYYY-MM-DDTHH:mm
showSeconds=true  -> YYYY-MM-DDTHH:mm:ss
```

Malformed/partial text stays visible, sets `badInput`, and contributes an empty form value. DST gaps/repeated times remain unchanged local wall times.

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

Date-only `min` starts at `00:00:00`; date-only `max` includes `23:59:59`.

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

CSS parts: `base`, `label`, `input`, `toggle`, `panel`, `calendar`, `time`, `clear`, `spinner`, `helper-text`, `error-text`.

Popup is top-layer when available, viewport-clamped, internally scrollable, and responsive. All seven date formats, 12/24-hour modes, seconds, sizes, dropdown/inline variants, year/month/Today navigation, loading, clear, helper/error text, methods, and existing events remain supported.

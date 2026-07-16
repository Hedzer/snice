# snice-time-picker

Form-associated editable local-time control with dropdown/inline hour, minute, optional second, and optional AM/PM selectors.

## Canonical contract

- Display: `format="24h"` uses `14:05`; `format="12h"` uses `2:05 PM`.
- Successful `FormData` value: `HH:mm`, or `HH:mm:ss` when `showSeconds` is true.
- Always local wall-clock time. No date, time zone, UTC conversion, or localized form value.
- Programmatic canonical input: zero-padded `HH:mm` or `HH:mm:ss`.
- Keyboard input uses the active display. With `showSeconds`, displayed seconds are required.
- Partial/malformed text is preserved, sets `badInput`, and submits `''` instead of malformed text.

```html
<form id="schedule">
  <snice-time-picker
    name="appointment"
    value="14:05:10"
    format="12h"
    step="5"
    min-time="09:00:00"
    max-time="17:00:00"
    show-seconds
    clearable
    required
  ></snice-time-picker>
</form>
```

`new FormData(schedule).get('appointment') === '14:05:10'` while the user sees `2:05:10 PM`.

## Live/default lifecycle

```ts
value: string;        // live value; not reflected to the value attribute
defaultValue: string; // value attribute and form-reset default
```

- Pristine `defaultValue`/`value`-attribute changes update live `value`.
- After property input/selection/clear/restore makes the control dirty, attribute changes update only `defaultValue`.
- `form.reset()` restores `defaultValue` with no user-change events.
- `formStateRestoreCallback` accepts string state only. Valid display or canonical text restores canonical `value`; partial text stays visible/invalid. Non-string state is ignored atomically.
- Exact visible text is stored as browser restoration state; canonical time is stored as the successful control value.
- Pre-upgrade own `value` assignments are adopted without leaving a shadowing own property.
- `format` and `showSeconds` update presentation/submission precision without rewriting the reset default.

## Form behavior

- FACE: listed in `form.elements`, participates in `FormData`, supports `form="id"`, `form.reset()`, browser restore, disabled fieldsets, and the first-legend exception.
- Exposes read-only `type === 'time'`, `form`, `labels`, `validity`, `validationMessage`, and `willValidate`.
- Authored/inherited `disabled`: all user paths blocked, omitted from `FormData`, barred from validation. Inherited disabledness does not mutate `disabled` or its attribute.
- `readonly`: all user editing blocked and barred from validation; current value remains in `FormData`.
- `loading`: all user editing blocked and barred from validation; current value remains in `FormData`.
- Reconnect preserves live/default state, form association, and outside-click behavior.
- Internal text input has no `name`; ElementInternals is the only form entry, preventing duplicates.

## Labels and accessible names

- Supports explicit `<label for="id">`, wrapping labels, and multiple labels combined in document order.
- Read-only `labels` is live across insertion, removal, reordering, retargeting, text changes, and reconnects.
- Base name precedence: associated labels, then `label`, then fallback `Time`.
- Label activation focuses without opening: editable input for dropdown, selector group for inline.
- Disabled, disabled-fieldset, and loading controls are inert to label activation.
- Related names: `<name>: open time picker`, `Clear <name>`, `<name> controls`, and `<name> hours|minutes|seconds|period`.
- One stable `aria-describedby` targets helper/error text; error replaces helper, uses `role="alert"`, and invalid state uses `aria-invalid`.

## Validation

Validity flags:

- `valueMissing`: `required && canonicalValue === ''`.
- `badInput`: non-empty visible text that cannot be parsed in active display format.
- `rangeUnderflow`: exact time before valid `minTime` / `min-time`.
- `rangeOverflow`: exact time after valid `maxTime` / `max-time`.
- `stepMismatch`: minute not divisible by effective `step`, or visible second not divisible by it.
- `customError`: non-empty `setCustomValidity(message)`.

`min-time`/`max-time` accept canonical `HH:mm` or `HH:mm:ss`; malformed constraints are ignored and boundaries are inclusive. Supported steps: `1|5|10|15|30`, default `15`. Step controls minute options, visible second options, and validity. Invalid runtime step values safely fall back to `15`.

`invalid` is visual/ARIA presentation only; it does not change native validity. Use constraints or `setCustomValidity()` for form errors.

## Properties

```ts
value: string = '';
defaultValue: string = '';             // attr: value
format: '12h'|'24h' = '24h';
step: 1|5|10|15|30 = 15;
minTime: string = '';                  // attr: min-time
maxTime: string = '';                  // attr: max-time
showSeconds: boolean = false;          // attr: show-seconds
disabled: boolean = false;
readonly: boolean = false;
loading: boolean = false;
clearable: boolean = false;
placeholder: string = '';
label: string = '';
helperText: string = '';               // attr: helper-text
errorText: string = '';                // attr: error-text
required: boolean = false;
invalid: boolean = false;              // visual only
name: string = '';
variant: 'dropdown'|'inline' = 'dropdown';
size: 'small'|'medium'|'large' = 'medium';
readonly type: 'time';
readonly form: HTMLFormElement|null;
readonly validity: ValidityState;
readonly validationMessage: string;
readonly willValidate: boolean;
readonly labels: NodeList|null;
```

## Interaction

- Dropdown: input click, clock click, `Enter`, or `ArrowDown` opens; `Escape` closes. Space is not intercepted because 12-hour keyboard input needs it.
- Inline: selectors stay visible and interactive; it does not retain a popover attribute and is the external-label focus target.
- Range logic disables selector intervals wholly outside min/max. Guards also reject disabled option events.
- Every selector and UI clear path is blocked by disabled, inherited fieldset disabledness, readonly, and loading.
- Public `clear()` remains an imperative API and emits clear then change.

## Methods

```ts
open(): void;
close(): void;
clear(): void;
focus(): void;
blur(): void;
checkValidity(): boolean;
reportValidity(): boolean;
setCustomValidity(message: string): void;
```

## Events

- `time-change` -> `{ value, hours, minutes, seconds, formatted, timePicker }` for valid typed input, selector changes, and after clear.
- `timepicker-clear` -> `{ timePicker }`, before the clear-triggered `time-change`.
- `timepicker-focus` / `timepicker-blur` -> `{ timePicker }`.
- `timepicker-open` / `timepicker-close` -> `{ timePicker }`.
- Property assignment, form reset, and form-state restore emit no synthetic user-change event.

## CSS parts

`base`, `label`, `input`, `toggle`, `clear`, `spinner`, `dropdown`, `hours`, `minutes`, `seconds`, `period`, `helper-text`, `error-text`.

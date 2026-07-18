# snice-date-picker

Form-associated calendar/text date control. The machine value, reset default, and display text are separate.

## Import

```typescript
import 'snice/components/date-picker/snice-date-picker';
```

## API

```typescript
// Live value. Always canonical YYYY-MM-DD or ''. Assignment is silent and dirty.
value: string = '';

// Maps to the value content attribute and is restored by form reset.
defaultValue: string = '';

format:
  | 'mm/dd/yyyy' | 'dd/mm/yyyy'
  | 'yyyy-mm-dd' | 'yyyy/mm/dd'
  | 'dd-mm-yyyy' | 'mm-dd-yyyy'
  | 'mmmm dd, yyyy' = 'mm/dd/yyyy';

variant: 'outlined' | 'filled' | 'underlined' = 'outlined';
size: 'small' | 'medium' | 'large' = 'medium';
placeholder: string = '';
label: string = '';
helperText: string = ''; // helper-text
errorText: string = '';  // error-text
disabled: boolean = false;
readonly: boolean = false;
loading: boolean = false;
required: boolean = false;
invalid: boolean = false; // presentation only, not constraint validity
clearable: boolean = false;
min: string = ''; // canonical YYYY-MM-DD recommended
max: string = ''; // canonical YYYY-MM-DD recommended
name: string = '';
open: boolean = false;
firstDayOfWeek: number = 0; // first-day-of-week; 0=Sunday

readonly type: 'date';
readonly form: HTMLFormElement | null;
readonly validity: ValidityState;
readonly validationMessage: string;
readonly willValidate: boolean;
readonly labels: NodeList | null;

focus(): void;
blur(): void;
clear(): void;
show(): void;
hide(): void;
selectDate(date: Date): void;
goToMonth(year: number, zeroBasedMonth: number): void;
goToToday(): void;
checkValidity(): boolean;
reportValidity(): boolean;
setCustomValidity(message: string): void;
```

## Value/default/display contract

- `value` is live canonical `YYYY-MM-DD` data or `''`; it is also the submitted value.
- `defaultValue` and the `value` attribute are the authored/reset default.
- `format` controls visible/manual text only.
- Assigning canonical text always works. A valid string in the configured format also works; numeric `/` and `-` separators remain accepted for compatibility.
- Programmatic impossible/malformed dates sanitize to `''`.
- Manual partial/impossible text stays visible, but live `value` is `''` and `validity.badInput` is true.
- Dates are strict: month length and leap-year failures do not roll into another month.
- Assigning `value`, typing, selecting, clearing, or browser restoration dirties live state. Later default changes do not overwrite it.
- A form reset clears dirtiness and restores `value = defaultValue`. Reset/default changes/restoration emit no component events.

```html
<form id="booking">
  <snice-date-picker
    id="arrival"
    name="arrival"
    value="2026-03-15"
    format="dd/mm/yyyy"
  ></snice-date-picker>
  <button type="reset">Reset</button>
</form>
```

```typescript
arrival.value;        // '2026-03-15'
arrival.defaultValue; // '2026-03-15'
arrival.value = '20/03/2026';
arrival.value;        // '2026-03-20'; value attribute is still '2026-03-15'
booking.reset();      // arrival.value === '2026-03-15'
```

## Form contract

- Listed in `form.elements`; `form` reports the form owner, including `form="id"` association.
- Enabled + non-empty `name`: contributes `[name, canonicalValue]` to `FormData`.
- A named empty/invalid picker contributes `''`; required/bad input still blocks actual submission.
- Disabled or effectively disabled by a fieldset: omitted and barred from validation. Authored `disabled` property/attribute is not rewritten by the fieldset. The first `<legend>` exception is honored.
- `readonly`: successful in `FormData`, but barred from constraint validation.
- `loading`: blocks interaction but remains successful and participates in validation.
- Browser history/autofill restoration retains exact visible state; complete text derives a canonical value, partial text stays invalid.

## Validation

- `required` → `validity.valueMissing` when no valid date exists.
- invalid/partial manual text → `validity.badInput`.
- `min`/`max` → `rangeUnderflow`/`rangeOverflow`; boundaries are inclusive and out-of-range calendar days are disabled. Impossible constraints are ignored rather than rolled.
- Canonical constraints are recommended. Configured display-format constraints remain accepted; malformed constraints are ignored.
- `setCustomValidity(message)` sets `customError`; `setCustomValidity('')` clears it.
- `invalid`/`errorText` are visual presentation only.
- `disabled`, effective fieldset disabledness, and `readonly` are barred; `loading` is not.

```typescript
Array.from(new FormData(booking).entries()); // [['arrival', '2026-03-15']]
arrival.setCustomValidity('Unavailable');
arrival.reportValidity();
arrival.setCustomValidity('');
```

## Events

```typescript
// On every manual edit. value is canonical when valid/complete, otherwise ''.
'datepicker-input'  -> { value, datePicker }

// Manual change, clear, or selection. value and iso are canonical.
'datepicker-change' -> { value, date, formatted, iso, datePicker }
'datepicker-select' -> { date, formatted, iso, datePicker }
'datepicker-clear'  -> { datePicker }
'datepicker-focus'  -> { datePicker }
'datepicker-blur'   -> { datePicker }
'datepicker-open'   -> { datePicker }
'datepicker-close'  -> { datePicker }
```

All component events bubble and are composed. Direct property/default changes, reset, and state restoration are silent.

## CSS Parts

- `input`
- `calendar-toggle`
- `clear`
- `spinner`
- `calendar`
- `helper-text`
- `error-text`

## Keyboard/accessibility

- Tab/Shift+Tab traverse the input and calendar controls.
- Enter/Space on the input opens; Escape on the input closes.
- Calendar dates are labeled buttons; constrained dates are disabled.
- Calendar uses `popover="manual"`; input state mirrors disabled/readonly/required/loading/`aria-invalid`.
- External `<label for>`, wrapping labels, and multiple labels are supported. `labels` is live and returned in document order; label text, `for`, host `id`, insertion/removal, DOM moves, and reconnect update the name.
- External labels override the naming fallback: `label`, then `Date`. Label activation focuses the input without opening the calendar; disabled controls remain inert.
- `helperText` or `errorText` is referenced exactly once with `aria-describedby`. Error replaces helper, has `role="alert"`, and `invalid` mirrors to `aria-invalid` without establishing native invalidity.
- The popup is separately named `<accessible name> calendar`.

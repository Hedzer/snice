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

format: 'mm/dd/yyyy' | 'dd/mm/yyyy' | 'yyyy-mm-dd' | 'yyyy/mm/dd'
      | 'dd-mm-yyyy' | 'mm-dd-yyyy' | 'mmmm dd, yyyy' = 'mm/dd/yyyy';

variant: 'outlined' | 'filled' | 'underlined' = 'outlined';
size: 'small' | 'medium' | 'large' = 'medium';
placeholder: string = '';
label: string = '';
helperText: string = ''; // helper-text
errorText: string = '';  // error-text
disabled | readonly | loading | required | clearable: boolean = false;
invalid: boolean = false; // presentation only, not constraint validity
min: string = ''; max: string = ''; // canonical YYYY-MM-DD recommended
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

- `base` - Root wrapper around the whole control
- `label` - Field label above the input
- `label-required` - Added to `label` when `required` is set
- `input-container` - Wrapper holding the input, its buttons and the calendar popup
- `input` - Text input
- `input-invalid` - Added to `input` while the value is invalid
- `input-clearable` - Added to `input` when `clearable` is set
- `input-loading` - Added to `input` while `loading` is set
- `calendar-toggle` - Calendar button
- `clear` - Clear button
- `clear-visible` - Added to `clear` while the clear button is shown
- `spinner` - Loading spinner
- `calendar` - Calendar popup
- `calendar-open` - Added to `calendar` while the popup is open
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

## Keyboard/accessibility

- Tab/Shift+Tab traverse the input and calendar controls.
- Enter/Space on the input opens; Escape on the input closes.
- Calendar dates are labeled buttons; constrained dates are disabled.
- Calendar uses `popover="manual"`; input state mirrors disabled/readonly/required/loading/`aria-invalid`.
- External `<label for>`, wrapping labels, and multiple labels are supported. `labels` is live and returned in document order; label text, `for`, host `id`, insertion/removal, DOM moves, and reconnect update the name.
- External labels override the naming fallback: `label`, then `Date`. Label activation focuses the input without opening the calendar; disabled controls remain inert.
- `helperText` or `errorText` is referenced exactly once with `aria-describedby`. Error replaces helper, has `role="alert"`, and `invalid` mirrors to `aria-invalid` without establishing native invalidity.
- The popup is separately named `<accessible name> calendar`.

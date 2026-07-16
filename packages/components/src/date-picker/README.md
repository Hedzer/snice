# Snice Date Picker

Calendar-backed text date control with strict parsing, seven display formats, min/max constraints, clear/loading/readonly/disabled states, and complete native form lifecycle behavior.

## Core model

- `value` is live canonical `YYYY-MM-DD` data or `''`.
- `defaultValue` maps to the `value` content attribute and is the reset default restored by form reset.
- `format` controls visible/manual text, never the submitted value.
- Partial or impossible manual text stays visible but sets `value = ''` and `validity.badInput`.
- Programmatic malformed values sanitize to `''`; valid configured-format strings remain accepted for compatibility.
- Named enabled controls participate in `FormData`; required/min/max/custom validity, reset, restoration, explicit form ownership, readonly, disabled fieldsets, and the first-legend exception are supported.

```html
<form id="booking">
  <snice-date-picker
    id="arrival"
    name="arrival"
    value="2026-03-15"
    format="dd/mm/yyyy"
    min="2026-03-10"
    max="2026-03-20"
    label="Arrival date"
    clearable
    required
  ></snice-date-picker>
  <button type="submit">Submit</button>
  <button type="reset">Reset</button>
</form>
```

```typescript
arrival.value; // '2026-03-15'; visible input is '15/03/2026'
Array.from(new FormData(booking).entries()); // [['arrival', '2026-03-15']]

arrival.value = '20/03/2026'; // configured-format compatibility
arrival.value; // '2026-03-20'; authored value attribute is unchanged
booking.reset(); // restores '2026-03-15'
```

## Properties

| Property | Attribute | Type/default | Purpose |
|----------|-----------|--------------|---------|
| `value` | -- | `string = ''` | Live canonical date. |
| `defaultValue` | `value` | `string = ''` | Authored/reset default. |
| `format` | `format` | `DateFormat = 'mm/dd/yyyy'` | Visible/manual format. |
| `size` | `size` | `'small' \| 'medium' \| 'large'` | Control size. |
| `variant` | `variant` | `'outlined' \| 'filled' \| 'underlined'` | Visual variant. |
| `placeholder` | `placeholder` | `string` | Explicit placeholder; otherwise format hint. |
| `label` | `label` | `string` | Visible label. |
| `helperText` | `helper-text` | `string` | Supporting text. |
| `errorText` | `error-text` | `string` | Visible error text. |
| `disabled` | `disabled` | `boolean` | Authored disabled state. |
| `readonly` | `readonly` | `boolean` | Read-only successful control. |
| `loading` | `loading` | `boolean` | Spinner/interaction lock; form participation remains. |
| `required` | `required` | `boolean` | Required validity constraint. |
| `invalid` | `invalid` | `boolean` | Visual/ARIA state only. |
| `clearable` | `clearable` | `boolean` | Shows clear button for editable text. |
| `min` / `max` | same | `string` | Inclusive date bounds; canonical values recommended. |
| `name` | `name` | `string` | Form key. |
| `open` | `open` | `boolean` | Popup state. |
| `firstDayOfWeek` | `first-day-of-week` | `number = 0` | First weekday column. |

Read-only native properties: `type`, `form`, `validity`, `validationMessage`, `willValidate`, and `labels`.

`DateFormat`: `mm/dd/yyyy`, `dd/mm/yyyy`, `yyyy-mm-dd`, `yyyy/mm/dd`, `dd-mm-yyyy`, `mm-dd-yyyy`, or `mmmm dd, yyyy`.

## Methods

- `focus()` / `blur()`
- `clear()`
- `show()` / `hide()`
- `selectDate(date)`
- `goToMonth(year, zeroBasedMonth)`
- `goToToday()`
- `checkValidity()` / `reportValidity()`
- `setCustomValidity(message)`

## Events

- `datepicker-input` → `{ value, datePicker }`
- `datepicker-change` → `{ value, date, formatted, iso, datePicker }`
- `datepicker-select` → `{ date, formatted, iso, datePicker }`
- `datepicker-clear`, `datepicker-focus`, `datepicker-blur`, `datepicker-open`, `datepicker-close` → `{ datePicker }`

Event `value`/`iso` fields are canonical. Events bubble and are composed. Direct assignments and form lifecycle restoration are silent.

## CSS Parts

`input`, `calendar-toggle`, `clear`, `spinner`, `calendar`, `helper-text`, `error-text`.

See the complete human reference at `docs/components/date-picker.md` and the compact AI contract at `docs/ai/components/date-picker.md`.

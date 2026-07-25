# snice-select

Customizable dropdown selection with single/multiple, search, editable input, and icons.

## Components

- `snice-select` - Container with trigger, dropdown, form integration
- `snice-option` - Declarative option elements

## Properties

### snice-select

```typescript
value: string = '';                 // Live; comma-separated for multiple
defaultValue: string = '';          // attr: value; authored/reset default
disabled: boolean = false;
required: boolean = false;
invalid: boolean = false;
readonly: boolean = false;
loading: boolean = false;
multiple: boolean = false;
searchable: boolean = false;
clearable: boolean = false;
editable: boolean = false;          // Text input trigger instead of button
allowFreeText: boolean = false;     // attr: allow-free-text
remote: boolean = false;            // Remote search via @request('select/search')
searchDebounce: number = 300;       // attr: search-debounce
open: boolean = false;
readonly isOpen: boolean;             // Current open state
size: 'small'|'medium'|'large' = 'medium';
name: string = '';
label: string = '';                   // Visible label + accessible-name fallback
helperText: string = '';              // attr: helper-text
errorText: string = '';               // attr: error-text; wins over helperText
placeholder: string = 'Select an option';
maxHeight: string = '200px';        // attr: max-height
options: SelectOption[] = [];       // JS only, works alongside <snice-option> children
readonly labels: NodeList | null;   // Current explicit/wrapping external labels
readonly type: 'select-one' | 'select-multiple';
readonly form: HTMLFormElement | null;
readonly validity: ValidityState;
readonly validationMessage: string;
readonly willValidate: boolean;
```

### snice-option

```typescript
value: string = '';       // Falls back to label
label: string = '';       // Falls back to textContent
disabled: boolean = false;
selected: boolean = false;
icon: string = '';        // Icon URL
```

## Value and form lifecycle

- `value` is live; `defaultValue` reflects the host `value` attribute.
- Pristine selects follow default changes. Selection, clear, editable commits, restoration, or any `value` assignment (including the same value) makes live state dirty.
- `form.reset()` restores the current default silently. Repeated resets, reconnects, form moves, and inherited fieldset disabledness retain authored state.

## Methods

- `focus()` / `blur()` - Focus/blur trigger
- `clear()` - Clear selection
- `openDropdown()` / `closeDropdown()` / `toggleDropdown()` - Dropdown control
- `selectOption(value)` - Select by value
- `checkValidity()` / `reportValidity()` - Check/report current constraint validity
- `setCustomValidity(message)` - Set `customError`; pass `''` to clear it

## Events

- `select-change` → `{ value: string | string[], option?, select }`
- `select-open` → `{ select }`
- `select-close` → `{ select }`

## CSS Parts

- `label`, `trigger`, `value`, `input`, `arrow`, `spinner`
- `dropdown`, `search`, `search-input`, `options`, `option`, `helper-text`, `error-text`

## Basic Usage

```html
<!-- Declarative options -->
<snice-select label="Choose" name="choice">
  <snice-option value="1">Option 1</snice-option>
  <snice-option value="2">Option 2</snice-option>
</snice-select>

<!-- Editable input mode -->
<snice-select editable label="Fruit" placeholder="Type or select..."></snice-select>
```

```typescript
select.options = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana', icon: '/icons/banana.svg' }
];
select.addEventListener('select-change', (e) => console.log(e.detail.value));
```

## Editable Mode

- `editable` renders text input instead of button
- Typing filters options; blur commits value
- `allow-free-text` accepts values not in options list
- `remote` + `editable` enables async search via @request/@respond

## External Labels and Accessible Name

```html
<label for="country">Shipping country</label>
<snice-select id="country" name="country" helper-text="Used for delivery options">
  <snice-option value="ca">Canada</snice-option>
  <snice-option value="us">United States</snice-option>
</snice-select>

<label>
  Billing country
  <snice-select id="billing-country" editable></snice-select>
</label>
```

Contract:

- Explicit `<label for>` and wrapping `<label>` association are supported through the form-associated host.
- Associated external labels are combined in document order and override `label` for the accessible name. With no association, naming falls back to `label`, then `Select`.
- Option descendants of a wrapping label and hidden/`aria-hidden` decorations are excluded from its text.
- Dynamic label text, `aria-label`, `aria-labelledby`, `for`, host `id`, DOM moves, and standard/editable mode update the shadow focus target.
- A label click focuses the standard button without opening it. In editable mode it focuses the input, preserving the existing focus-to-open behavior. Disabled controls do not receive focus.
- `labels` exposes the current associated elements.
- `helperText` and `errorText` use exactly one `aria-describedby` target. `errorText` wins; authored or calculated invalid state controls `aria-invalid`.

## Form Integration

- The host submits through `ElementInternals.setFormValue()`; there is no hidden native `<select>`.
- Set `name` for `FormData` participation. The host is listed in `form.elements` and supports explicit `form="id"`, reset/restoration, labels, and disabled fieldsets.
- Single select submits one string. Multiple select submits its established comma-separated `value` contract as one entry.
- Empty `required` single or multiple selection reports `valueMissing`, updates styling/`aria-invalid`, and blocks validated submission.
- `setCustomValidity()` supplies application errors. Constraint and custom errors recalculate immediately and survive temporary barred states.
- Disabled controls are omitted and barred. `readonly` remains successful but is barred. `loading` is inert and barred while preserving the successful value.
- `invalid` and `errorText` control presentation only; they do not change native validity.

## CSS Custom Properties

- `--snice-select-min-height` - Select minimum height

## Accessibility

- Explicit, wrapping, multiple, and dynamically reassociated external labels
- External labels focus and name the real shadow button/input
- One helper/error description, with error precedence
- Direct form-associated custom-element submission through `ElementInternals`
- Arrow keys, Enter, Escape for keyboard navigation
- Dropdown closes on outside click
- Children take precedence over `options` array

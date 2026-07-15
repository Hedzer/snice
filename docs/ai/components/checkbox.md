# snice-checkbox

Form-associated checkbox with native checked/default, successful-control, validation, reset, restoration, event, and disabled-fieldset behavior.

## Import

```typescript
import 'snice/components/checkbox/snice-checkbox';
```

## API

```typescript
// Live state; JS-only and silent when assigned.
checked: boolean = false;

// Reset default. Maps to the `checked` content attribute.
defaultChecked: boolean = false;

indeterminate: boolean = false;
disabled: boolean = false;
loading: boolean = false;
required: boolean = false;
invalid: boolean = false; // presentation only; not constraint validity
size: 'small' | 'medium' | 'large' = 'medium';
name: string = '';
value: string = 'on';
label: string = '';

readonly type: 'checkbox';
readonly form: HTMLFormElement | null;
readonly validity: ValidityState;
readonly validationMessage: string;
readonly willValidate: boolean;
readonly labels: NodeList | null;

focus(): void;
blur(): void;
click(): void;
toggle(): void;
setIndeterminate(): void;
checkValidity(): boolean;
reportValidity(): boolean;
setCustomValidity(message: string): void;
```

## Checked/default model

- `checked` is current checkedness. Every assignment makes it dirty, even an assignment of the existing value.
- `defaultChecked` and the `checked` attribute are the authored/reset default.
- A default change updates `checked` only while checkedness is clean.
- Form reset clears dirty checkedness and restores `checked = defaultChecked`.
- Reset and default changes preserve `indeterminate`.
- `setIndeterminate()` sets only `indeterminate`; it does not uncheck or emit events.

```html
<form id="preferences">
  <snice-checkbox name="digest" value="weekly" checked
    label="Weekly digest"></snice-checkbox>
  <button type="reset">Reset</button>
</form>
```

## Form contract

- Checked + enabled + non-empty `name`: contributes `[name, value]` to `FormData`.
- Unchecked, disabled, effectively fieldset-disabled, or empty-name: omitted.
- `value` is exact, including an empty string; default value is `'on'`.
- Repeated names produce repeated ordered entries.
- Unchecked `required` sets `validity.valueMissing`, invalidates the form, and blocks submission.
- `setCustomValidity(message)` sets `customError`; pass `''` to clear it.
- `invalid` is visual/ARIA state only.
- Disabled fieldset ancestry does not rewrite the authored `disabled` property or attribute. The first-legend exception is honored.
- `loading` blocks pointer/programmatic activation but does not change form submission or validation participation.
- External association with `form="form-id"`, external-label activation, `form`, `labels`, `willValidate`, and browser restore state are supported.

## User events

An actual pointer, keyboard, label, `click()`, or `toggle()` state transition emits, in order:

1. `input` (`Event`)
2. `change` (`Event`)
3. `checkbox-change` (`CustomEvent<{ checked, indeterminate, checkbox }>`)

All bubble from the host and are composed. Direct property changes, `setIndeterminate()`, reset, and state restoration are silent. Disabled/loading/effectively-disabled activation and canceled clicks neither change state nor emit these events.

```typescript
checkbox.addEventListener('change', () => {
  console.log(checkbox.checked);
});

checkbox.addEventListener('checkbox-change', event => {
  console.log(event.detail.checked, event.detail.indeterminate);
});
```

## CSS Parts

- `input` - native checkbox input
- `checkbox` - visual checkbox
- `spinner` - loading spinner
- `label` - label text

## Keyboard/accessibility

- `Space`: toggle
- `Tab` / `Shift+Tab`: move focus
- Native input semantics, mixed `aria-checked`, associated labels, `aria-invalid`, and visible focus are preserved.

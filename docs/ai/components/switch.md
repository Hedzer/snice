# snice-switch

Toggle switch input for boolean selections.

## Properties

```typescript
checked: boolean = false;          // live property only
defaultChecked: boolean = false;   // attr: checked; authored/reset default
disabled: boolean = false;
loading: boolean = false;
required: boolean = false;
invalid: boolean = false;
size: 'small'|'medium'|'large' = 'medium';
name: string = '';
value: string = 'on';
label: string = '';
labelOn: string = '';              // attr: label-on
labelOff: string = '';             // attr: label-off
readonly type: 'checkbox';
readonly form: HTMLFormElement | null;
readonly validity: ValidityState;
readonly validationMessage: string;
readonly willValidate: boolean;
readonly labels: NodeList | null;
```

## Checked and form lifecycle

- `checked` is live; `defaultChecked` reflects the `checked` content attribute.
- Any checked assignment/toggle, including the same value, dirties live checkedness. Pristine state follows default changes.
- Reset silently restores `defaultChecked`; browser state uses `checked`/`unchecked`.
- Only checked enabled switches contribute `value` to `FormData`. Form moves/reconnect/fieldset state never rewrite authored defaults or `disabled`.
- The form-associated host submits through `ElementInternals`; the unnamed shadow checkbox is the interaction control, not a second form field.
- An unchecked enabled `required` switch reports `valueMissing`, invalidates its form, and blocks submission. Checked clears it immediately.
- `setCustomValidity(message)` controls `customError`; pass `''` to clear it. Calculated errors drive `aria-invalid` and invalid styling.
- `invalid` is visual/ARIA presentation only. `loading` blocks interaction and bars validation without changing successful-control state. Disabled controls are omitted and barred.
- Supports explicit `form="id"`, external/wrapping labels, `form.elements`, reset/restoration, disabled fieldsets, and the first-legend exception.

## Methods

- `toggle()` - Toggle switch state
- `focus()` - Focus the switch
- `blur()` - Remove focus
- `click()` - Programmatic click
- `checkValidity()` / `reportValidity()` - Check/report current validity
- `setCustomValidity(message)` - Set or clear a custom validation error

## Events

- `input` then `change` bubble and compose for customer activation
- `switch-change` → `{ checked, switch }`, after the standard events

## CSS Parts

- `input` - Hidden input element
- `track` - Switch track
- `thumb` - Switch thumb
- `spinner` - Loading spinner
- `label` - Label text

## Basic Usage

```html
<snice-switch label="Enable notifications"></snice-switch>
<snice-switch checked label="Dark mode"></snice-switch>
<snice-switch size="small" label="Compact"></snice-switch>
<snice-switch label-on="On" label-off="Off"></snice-switch>
<snice-switch loading label="Saving..."></snice-switch>
<snice-switch disabled></snice-switch>
```

## Accessibility

- `role="switch"` with `aria-checked`
- Associated labels focus and activate the real switch; `labels` is live
- Calculated or authored errors set `aria-invalid`
- Space key to toggle
- Visible focus ring on keyboard navigation

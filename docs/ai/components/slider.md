# snice-slider

Range slider for numeric value selection. Form-associated.

## Properties

```typescript
value: number = 0;                // live property only
defaultValue: number = 0;         // attr: value; authored/reset default
min: number = 0;
max: number = 100;
step: number = 1;
variant: 'default'|'primary'|'success'|'warning'|'danger' = 'default';
size: 'small'|'medium'|'large' = 'medium';
disabled: boolean = false;
required: boolean = false;
invalid: boolean = false;       // visual/ARIA presentation only
readonly: boolean = false;
loading: boolean = false;
label: string = '';
helperText: string = '';       // attr: helper-text
errorText: string = '';        // attr: error-text
name: string = '';
showValue: boolean = false;    // attr: show-value
showTicks: boolean = false;    // attr: show-ticks
vertical: boolean = false;
// form-align: CSS-only attribute, aligns with inputs in form rows
readonly type: 'range';
readonly form: HTMLFormElement | null;
readonly validity: ValidityState;
readonly validationMessage: string;
readonly willValidate: boolean;
readonly labels: NodeList | null;
```

## Value and form lifecycle

- `value` is live clamped/stepped state; `defaultValue` reflects the `value` attribute. The step lattice starts at `min`, matching native range. Zero, negative, or non-finite steps fall back to `1`.
- Pristine state follows default changes. Pointer/touch/keyboard input, restore, or any assignment dirties it.
- Reset/restoration are silent. Repeated reset, reconnect, form moves, and fieldset disabledness retain authored state.

## Form and validation contract

- Named sliders are listed in `form.elements` and contribute one normalized numeric string to `FormData`. Explicit `form="id"`, live labels, reset/restoration, and disabled fieldsets are supported.
- Like native `input[type=range]`, a normalized numeric value is always present; `required` is a marker and cannot create `valueMissing`.
- Use `setCustomValidity(message)` for business rules. The error updates `validity.customError`, `validationMessage`, `aria-invalid`, track/thumb styling, form reporting, and submission blocking; pass `''` to clear it.
- Error text is rendered/announced once only while authored or calculated invalid presentation is active. Otherwise helper text remains visible.
- Disabled controls are omitted and barred. Readonly/loading controls retain their successful value but are barred. `invalid` alone is visual/ARIA only.

## Methods

- `focus()` / `blur()` - Focus/blur thumb
- `checkValidity()` - Returns boolean
- `reportValidity()` - Returns boolean
- `setCustomValidity(message)` - Set validation message

## Events

- `slider-input` → `{ value: number, slider }` - During drag
- `slider-change` → `{ value: number, slider }` - After commit

## CSS Parts

- `track`, `fill`, `thumb`, `spinner`, `error-text`, `helper-text`

## Basic Usage

```html
<snice-slider label="Volume" min="0" max="100" value="50" show-value></snice-slider>
<snice-slider show-ticks min="0" max="10" step="1"></snice-slider>
<snice-slider variant="primary" size="large"></snice-slider>
<snice-slider vertical></snice-slider>
<snice-slider label="Qty" form-align></snice-slider>
```

## Keyboard Navigation

- Arrow keys: adjust by step
- Home/End: min/max

## Accessibility

- Form-associated via ElementInternals
- `role="slider"` with aria-valuenow/min/max
- Validation via checkValidity/reportValidity/setCustomValidity
- Explicit/wrapping labels name and focus the thumb; calculated and authored errors share `aria-invalid`

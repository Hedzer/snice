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
invalid: boolean = false;
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
```

## Value and form lifecycle

- `value` is live clamped/stepped state; `defaultValue` reflects the `value` attribute.
- Pristine state follows default changes. Pointer/touch/keyboard input, restore, or any assignment dirties it.
- Reset/restoration are silent. Repeated reset, reconnect, form moves, and fieldset disabledness retain authored state.

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

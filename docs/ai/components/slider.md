# snice-slider

Range slider for numeric value selection. Form-associated.

## Properties

```typescript
value: number = 0;
min: number = 0;
max: number = 100;
step: number = 1;
variant: 'default'|'primary'|'success'|'warning'|'danger' = 'default';
size: 'small'|'medium'|'large' = 'medium';
disabled: boolean = false;
required: boolean = false;
invalid: boolean = false;
readonly: boolean = false;
label: string = '';
helperText: string = '';       // attr: helper-text
errorText: string = '';        // attr: error-text
name: string = '';
showValue: boolean = false;    // attr: show-value
showTicks: boolean = false;    // attr: show-ticks
vertical: boolean = false;
loading: boolean = false;
// form-align: CSS-only attribute (no JS property). Gives the slider track area
// min-height: 2.5rem (40px) so it aligns with input/select fields in form rows.
```

## Events

- `slider-input` → `{ value, slider }` - During drag
- `slider-change` → `{ value, slider }` - After drag complete

## Methods

- `focus()` - Focus slider thumb
- `blur()` - Blur slider thumb
- `checkValidity()` - Check validation, returns `boolean`
- `reportValidity()` - Report validation to user, returns `boolean`
- `setCustomValidity(message)` - Set custom validation message

## Usage

```html
<snice-slider label="Volume" min="0" max="100"></snice-slider>
<snice-slider show-value value="50"></snice-slider>
<snice-slider show-ticks min="0" max="10" step="1"></snice-slider>
<snice-slider variant="primary"></snice-slider>
<snice-slider size="small"></snice-slider>
<snice-slider vertical></snice-slider>
<snice-slider label="Qty" form-align></snice-slider> <!-- aligns with inputs in form rows -->
<snice-slider min="0" max="100" step="5" value="50"></snice-slider>
```

## CSS Parts

`track`, `fill`, `thumb`, `spinner`, `error-text`, `helper-text`

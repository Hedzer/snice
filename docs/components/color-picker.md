<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/color-picker.md -->

# Color Picker Component

A form-associated color selection interface with format conversion, preset colors, and live native label association.

## Table of Contents
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Accessibility](#accessibility)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Size variant |
| `value` | `string` | `'#000000'` | Live color value; property only |
| `defaultValue` (attr: `value`) | `string` | `'#000000'` | Authored color restored by form reset |
| `format` | `'hex' \| 'rgb' \| 'hsl'` | `'hex'` | Display format |
| `label` | `string` | `''` | Label text |
| `helperText` (attr: `helper-text`) | `string` | `''` | Helper text below the input |
| `errorText` (attr: `error-text`) | `string` | `''` | Error message text |
| `disabled` | `boolean` | `false` | Disabled state |
| `required` | `boolean` | `false` | Required state for form validation |
| `invalid` | `boolean` | `false` | Invalid state |
| `name` | `string` | `''` | Form field name |
| `showInput` (attr: `show-input`) | `boolean` | `true` | Show text input field |
| `showPresets` (attr: `show-presets`) | `boolean` | `false` | Show preset color swatches |
| `presets` | `string[]` | `[...]` | Array of preset color values |
| `loading` | `boolean` | `false` | Loading state with spinner |
| `type` | `'color'` | `'color'` | Read-only native-compatible control type |
| `form` | `HTMLFormElement \| null` | — | Read-only owning form |
| `validity` | `ValidityState` | — | Read-only constraint-validation flags |
| `validationMessage` | `string` | `''` | Read-only current validation message |
| `willValidate` | `boolean` | — | Read-only validation eligibility |
| `labels` | `NodeList \| null` | — | Read-only live associated labels |

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `focus()` | -- | Focus the text input, or the swatch when `showInput` is false, if interaction is allowed |
| `blur()` | -- | Remove focus from the text input or swatch |
| `checkValidity()` | -- | Check current constraint validity |
| `reportValidity()` | -- | Report current validity |
| `setCustomValidity(message)` | `string` | Set a custom error; pass `''` to clear it |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `color-picker-input` | `{ value: string, colorPicker }` | Fired during color input as the user adjusts the color |
| `color-picker-change` | `{ value: string, colorPicker }` | Fired when the color value is committed |
| `color-picker-focus` | `{ colorPicker }` | Fired when the input receives focus |
| `color-picker-blur` | `{ colorPicker }` | Fired when the input loses focus |

## CSS Parts

| Part | Description |
|------|-------------|
| `spinner` | Loading spinner element |
| `error-text` | Error text element |
| `helper-text` | Helper text element |

```css
snice-color-picker::part(error-text) {
  font-size: 0.75rem;
  color: red;
}
```

## Basic Usage

```html
<snice-color-picker label="Brand Color" value="#3b82f6"></snice-color-picker>
```

### Live Color and Reset Default

`value` is live color state. Valid hex, `rgb(r, g, b)`, and `hsl(h, s%, l%)` input is canonicalized to six-digit hex; malformed editable text remains observable and reports `badInput` so customers can correct it. `defaultValue` reflects the `value` content attribute and is restored by `form.reset()`. Default changes update a pristine picker; typing, choosing a native color, selecting a preset, assigning `value` (even unchanged), or browser restoration makes it dirty. Reset and restoration do not emit color/input/change events. Reconnects and form moves preserve both values, while disabled fieldsets disable the text field, chooser, and presets without rewriting authored `disabled`.

```typescript
import 'snice/components/color-picker/snice-color-picker';
```

## Examples

### Color Formats

Use the `format` attribute to change the displayed color format.

```html
<snice-color-picker format="hex" label="Hex Color"></snice-color-picker>
<snice-color-picker format="rgb" label="RGB Color"></snice-color-picker>
<snice-color-picker format="hsl" label="HSL Color"></snice-color-picker>
```

### Sizes

Use the `size` attribute to change the picker dimensions.

```html
<snice-color-picker size="small" label="Small"></snice-color-picker>
<snice-color-picker size="medium" label="Medium"></snice-color-picker>
<snice-color-picker size="large" label="Large"></snice-color-picker>
```

### With Preset Colors

Set `show-presets` to display a row of preset color swatches for quick selection.

```html
<snice-color-picker label="Theme Color" show-presets></snice-color-picker>
```

### Custom Presets

Use the `presets` property to provide your own set of preset colors.

```html
<snice-color-picker
  label="Brand Colors"
  show-presets
  presets='["#ff0000", "#00ff00", "#0000ff", "#ffcc00"]'
></snice-color-picker>
```

### Without Text Input

Set `show-input="false"` to hide the text input and show only the color swatch.

```html
<snice-color-picker label="Pick a Color" show-input="false"></snice-color-picker>
```

### Form Validation

The host is listed in `form.elements`, participates in `FormData`, supports `form="id"`, labels, reset/restoration, and native validated submission. Empty `required` values report `valueMissing`; malformed color text reports `badInput`; `setCustomValidity()` supplies `customError`. The default `#000000` means `required` starts satisfied unless the live value is cleared. Disabled and loading pickers are barred from validation; disabled pickers are omitted, while loading preserves the successful value. `invalid` is presentation/ARIA only.

```html
<snice-color-picker
  label="Required Color"
  required
  invalid
  error-text="Please select a color"
></snice-color-picker>
```

### Event Handling

Listen for color changes to sync with your application state.

```javascript
const picker = document.querySelector('snice-color-picker');

picker.addEventListener('color-picker-change', (e) => {
  console.log('Color changed to:', e.detail.value);
});

picker.addEventListener('color-picker-input', (e) => {
  // Fires continuously as the user adjusts
  document.body.style.backgroundColor = e.detail.value;
});
```

## Accessibility

The picker accepts explicit `<label for="picker-id">`, wrapping labels, and multiple labels. Multiple labels form one accessible name in document order. The read-only `labels` property stays current when labels are added, removed, reordered, retargeted, or edited. If there is no associated label, the `label` property is used; the final fallback accessible name is `Color`.

Activating an associated or internal label focuses the text input when `showInput` is true, or the visible swatch when it is false. Disabled, disabled-fieldset, and loading pickers are inert. Inert controls cannot be reached through label activation, keyboard activation, presets, the swatch, or the hidden native color input.

The primary text input or swatch owns the base field name. Related controls have distinct names: the companion swatch is `<field name> color chooser`, and every preset is `Set <field name> to <color>`. The hidden native color input is only the browser color-dialog mechanism: it is unnamed, removed from the tab order, hidden from assistive technology, and never creates a duplicate form field. ElementInternals supplies the picker’s single form value.

Helper or error text is connected to the primary target through one stable `aria-describedby` reference. Error text replaces helper text and uses `role="alert"`. `aria-invalid` reflects authored `invalid` or calculated validity. Keyboard users can activate the swatch and presets with Enter or Space.

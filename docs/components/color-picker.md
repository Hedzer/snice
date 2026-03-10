<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/color-picker.md -->

# Color Picker Component

A color selection interface with format conversion, preset colors, and form integration.

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
| `value` | `string` | `'#000000'` | Current color value |
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

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `focus()` | -- | Focus the color picker input |
| `blur()` | -- | Remove focus from the color picker input |

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

Use `required`, `invalid`, and `error-text` for form validation feedback.

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

- Form-associated custom element with native form integration
- Label association for screen readers
- Keyboard accessible color input
- Error and helper text announced to assistive technology

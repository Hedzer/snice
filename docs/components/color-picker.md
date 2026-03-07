<!-- AI: For a low-token version of this doc, use docs/ai/components/color-picker.md instead -->

# Color Picker Component

The `<snice-color-picker>` component provides a color selection interface with format conversion and preset colors.

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `value` | `string` | `'#000000'` | Current color value |
| `format` | `'hex' \| 'rgb' \| 'hsl'` | `'hex'` | Display format |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Size variant |
| `label` | `string` | `''` | Label text |
| `helperText` (attr: `helper-text`) | `string` | `''` | Helper text |
| `errorText` (attr: `error-text`) | `string` | `''` | Error message |
| `disabled` | `boolean` | `false` | Disabled state |
| `required` | `boolean` | `false` | Required state |
| `invalid` | `boolean` | `false` | Invalid state |
| `name` | `string` | `''` | Form field name |
| `showInput` (attr: `show-input`) | `boolean` | `true` | Show text input |
| `showPresets` (attr: `show-presets`) | `boolean` | `false` | Show preset colors |
| `presets` | `string[]` | `[...]` | Preset color values |

## Methods

### `focus(): void`
Focus the color picker.

### `blur(): void`
Blur the color picker.

## Events

### `color-picker-change`
Fired when color changes.

**Detail**: `{ value: string, colorPicker: SniceColorPickerElement }`

## Basic Usage

```html
<snice-color-picker
  label="Brand Color"
  value="#3b82f6"
  show-presets
></snice-color-picker>
```

## Examples

### Basic

```html
<snice-color-picker label="Background Color"></snice-color-picker>
```

### With Presets

```html
<snice-color-picker
  label="Theme Color"
  show-presets
></snice-color-picker>
```

### Different Formats

```html
<snice-color-picker format="hex" label="Hex"></snice-color-picker>
<snice-color-picker format="rgb" label="RGB"></snice-color-picker>
<snice-color-picker format="hsl" label="HSL"></snice-color-picker>
```

### Custom Presets

```html
<snice-color-picker
  label="Brand Colors"
  show-presets
  presets='["#ff0000", "#00ff00", "#0000ff"]'
></snice-color-picker>
```

[//]: # (AI: For a low-token version of this doc, use docs/ai/components/color-display.md instead)

# Color Display Component

The `<snice-color-display>` component displays colors with a swatch and formatted label.

## Basic Usage

```html
<snice-color-display value="#3b82f6"></snice-color-display>
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `value` | `string` | `''` | Color value (hex format) |
| `format` | `'hex' \| 'rgb' \| 'hsl'` | `'hex'` | Display format |
| `showSwatch` | `boolean` | `true` | Show color swatch |
| `showLabel` | `boolean` | `true` | Show color label |
| `swatchSize` | `'small' \| 'medium' \| 'large'` | `'medium'` | Swatch size |
| `label` | `string` | `''` | Custom label text |

## Examples

### Basic Colors

```html
<snice-color-display value="#ff0000"></snice-color-display>
<snice-color-display value="#00ff00"></snice-color-display>
<snice-color-display value="#0000ff"></snice-color-display>
```

### Color Formats

```html
<snice-color-display value="#3b82f6" format="hex"></snice-color-display>
<snice-color-display value="#3b82f6" format="rgb"></snice-color-display>
<snice-color-display value="#3b82f6" format="hsl"></snice-color-display>
```

### Swatch Sizes

```html
<snice-color-display value="#10b981" swatch-size="small"></snice-color-display>
<snice-color-display value="#10b981" swatch-size="medium"></snice-color-display>
<snice-color-display value="#10b981" swatch-size="large"></snice-color-display>
```

### Custom Labels

```html
<snice-color-display value="#ef4444" label="Error Red"></snice-color-display>
<snice-color-display value="#10b981" label="Success Green"></snice-color-display>
```

### Swatch Only

```html
<snice-color-display
  value="#3b82f6"
  show-label="false"
  swatch-size="large"
></snice-color-display>
```

### Label Only

```html
<snice-color-display
  value="#3b82f6"
  show-swatch="false"
  format="rgb"
></snice-color-display>
```

## Styling

```css
snice-color-display::part(container) {
  /* Container */
}

snice-color-display::part(swatch) {
  /* Color swatch */
}

snice-color-display::part(label) {
  /* Color label */
}
```

## Notes

- Colors must be provided in hex format (#RRGGBB)
- The component automatically converts to RGB and HSL formats
- When no custom label is provided, the formatted color value is used
- Swatch and label can be shown/hidden independently

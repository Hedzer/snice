<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/color-display.md -->

# Color Display Component

Displays colors with a swatch and formatted label. Supports hex, RGB, and HSL formats with configurable swatch sizes.

## Table of Contents
- [Properties](#properties)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `value` | `string` | `''` | Color value (hex format) |
| `format` | `'hex' \| 'rgb' \| 'hsl'` | `'hex'` | Display format |
| `showSwatch` (attr: `show-swatch`) | `boolean` | `true` | Show color swatch |
| `showLabel` (attr: `show-label`) | `boolean` | `true` | Show color label |
| `swatchSize` (attr: `swatch-size`) | `'small' \| 'medium' \| 'large'` | `'medium'` | Swatch size |
| `label` | `string` | `''` | Custom label text |

## CSS Parts

| Part | Description |
|------|-------------|
| `container` | The outer container |
| `swatch` | The color swatch element |
| `label` | The color label text |

```css
snice-color-display::part(swatch) {
  border-radius: 50%;
}

snice-color-display::part(label) {
  font-family: monospace;
}
```

## Basic Usage

```html
<snice-color-display value="#3b82f6"></snice-color-display>
```

```typescript
import 'snice/components/color-display/snice-color-display';
```

## Examples

### Color Formats

Use the `format` attribute to change the displayed color format.

```html
<snice-color-display value="#3b82f6" format="hex"></snice-color-display>
<snice-color-display value="#3b82f6" format="rgb"></snice-color-display>
<snice-color-display value="#3b82f6" format="hsl"></snice-color-display>
```

### Swatch Sizes

Use `swatch-size` to change the swatch dimensions.

```html
<snice-color-display value="#10b981" swatch-size="small"></snice-color-display>
<snice-color-display value="#10b981" swatch-size="medium"></snice-color-display>
<snice-color-display value="#10b981" swatch-size="large"></snice-color-display>
```

### Custom Labels

Use the `label` attribute to display a custom name instead of the color value.

```html
<snice-color-display value="#ef4444" label="Error Red"></snice-color-display>
<snice-color-display value="#10b981" label="Success Green"></snice-color-display>
```

### Swatch Only

Hide the label for a swatch-only display.

```html
<snice-color-display value="#3b82f6" show-label="false" swatch-size="large"></snice-color-display>
```

### Label Only

Hide the swatch for a text-only color value.

```html
<snice-color-display value="#3b82f6" show-swatch="false" format="rgb"></snice-color-display>
```

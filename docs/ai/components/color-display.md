# snice-color-display

Displays colors with swatch and label.

## Properties

```typescript
value: string = '';
format: 'hex'|'rgb'|'hsl' = 'hex';
showSwatch: boolean = true;      // attribute: show-swatch
showLabel: boolean = true;       // attribute: show-label
swatchSize: 'small'|'medium'|'large' = 'medium'; // attribute: swatch-size
label: string = '';
```

## Usage

```html
<!-- Basic -->
<snice-color-display value="#3b82f6"></snice-color-display>

<!-- Formats -->
<snice-color-display value="#ff0000" format="hex"></snice-color-display>
<snice-color-display value="#ff0000" format="rgb"></snice-color-display>
<snice-color-display value="#ff0000" format="hsl"></snice-color-display>

<!-- Sizes -->
<snice-color-display value="#10b981" swatch-size="small"></snice-color-display>
<snice-color-display value="#10b981" swatch-size="medium"></snice-color-display>
<snice-color-display value="#10b981" swatch-size="large"></snice-color-display>

<!-- Custom label -->
<snice-color-display value="#ef4444" label="Error Red"></snice-color-display>

<!-- Swatch only -->
<snice-color-display value="#3b82f6" show-label="false"></snice-color-display>

<!-- Label only -->
<snice-color-display value="#3b82f6" show-swatch="false"></snice-color-display>
```

## Features

- Auto-converts hex to RGB/HSL
- 3 swatch sizes (16px, 24px, 32px)
- Custom labels supported
- Swatch and label toggle
- Monospace font for color values

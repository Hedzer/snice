# snice-color-display

Displays colors with swatch and label.

## Properties

```typescript
value: string = '';
format: 'hex'|'rgb'|'hsl' = 'hex';
showSwatch: boolean = true;       // attribute: show-swatch
showLabel: boolean = true;        // attribute: show-label
swatchSize: 'small'|'medium'|'large' = 'medium'; // attribute: swatch-size
label: string = '';
```

## CSS Parts

- `container` - Outer container
- `swatch` - Color swatch element
- `label` - Color label text

## Basic Usage

```html
<snice-color-display value="#3b82f6"></snice-color-display>
<snice-color-display value="#ff0000" format="rgb"></snice-color-display>
<snice-color-display value="#10b981" swatch-size="large"></snice-color-display>
<snice-color-display value="#ef4444" label="Error Red"></snice-color-display>
<snice-color-display value="#3b82f6" show-label="false"></snice-color-display>
```

```typescript
import 'snice/components/color-display/snice-color-display';
```

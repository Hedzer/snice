<!-- AI: For a low-token version of this doc, use docs/ai/components/divider.md instead -->

# Divider
`<snice-divider>`

Separator line with optional text label.

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/divider/snice-divider';
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-divider.min.js"></script>
```

## Properties

| Property | Attribute | Type | Default | Description |
|----------|-----------|------|---------|-------------|
| `orientation` | `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Divider direction |
| `variant` | `variant` | `'solid' \| 'dashed' \| 'dotted'` | `'solid'` | Line style |
| `spacing` | `spacing` | `'none' \| 'small' \| 'medium' \| 'large'` | `'medium'` | Vertical margin |
| `align` | `align` | `'start' \| 'center' \| 'end'` | `'center'` | Text position |
| `text` | `text` | `string` | `''` | Text label content |
| `textBackground` | `text-background` | `string` | `''` | Text label background color |
| `color` | `color` | `string` | `''` | Custom divider color |
| `capped` | `capped` | `boolean` | `false` | Rounded line ends |

## CSS Custom Properties

| Property | Description | Default |
|----------|-------------|---------|
| `--divider-color` | Line color | `var(--snice-color-border)` |
| `--divider-thickness` | Line thickness | `1px` |
| `--divider-text-bg` | Text label background | `transparent` |
| `--divider-text-padding` | Text label padding | `0 1rem` |
| `--divider-text-gap` | Gap around text label | `1rem` |

## CSS Parts

Style internal elements from outside the shadow DOM using `::part()`.

| Part | Element | Description |
|------|---------|-------------|
| `base` | `<div>` | Outer divider container |
| `line` | `<div>` | The divider line(s) |
| `text` | `<span>` | Optional text label |

```css
snice-divider::part(line) {
  border-color: #3b82f6;
}

snice-divider::part(text) {
  font-weight: 600;
  color: #374151;
}
```

## Basic Usage

```typescript
import 'snice/components/divider/snice-divider';
```

```html
<snice-divider></snice-divider>
```

## Examples

### Variants

Use the `variant` attribute to change the line style.

```html
<snice-divider variant="solid"></snice-divider>
<snice-divider variant="dashed"></snice-divider>
<snice-divider variant="dotted"></snice-divider>
```

### With Text

Use the `text` attribute to add a label to the divider.

```html
<snice-divider text="OR"></snice-divider>
<snice-divider text="Section Title"></snice-divider>
```

### Text Alignment

Use the `align` attribute to position the text label.

```html
<snice-divider text="Start" align="start"></snice-divider>
<snice-divider text="Center" align="center"></snice-divider>
<snice-divider text="End" align="end"></snice-divider>
```

### Text Background

Use the `text-background` attribute to set the background behind the text label, useful when placed over colored backgrounds.

```html
<snice-divider text="Section" text-background="#ffffff"></snice-divider>
```

### Spacing

Use the `spacing` attribute to control vertical margin around the divider.

```html
<snice-divider spacing="none"></snice-divider>
<snice-divider spacing="small"></snice-divider>
<snice-divider spacing="medium"></snice-divider>
<snice-divider spacing="large"></snice-divider>
```

### Vertical Orientation

Set `orientation` to `vertical` for use in horizontal layouts.

```html
<div style="display: flex; align-items: center; height: 50px; gap: 1rem;">
  <span>Left</span>
  <snice-divider orientation="vertical"></snice-divider>
  <span>Right</span>
</div>
```

### Custom Color

Use the `color` attribute to change the divider color.

```html
<snice-divider color="#3b82f6"></snice-divider>
<snice-divider color="rgb(22 163 74)"></snice-divider>
```

### Capped Ends

Set the `capped` attribute for rounded line ends.

```html
<snice-divider capped></snice-divider>
<snice-divider capped variant="dashed"></snice-divider>
```

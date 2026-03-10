<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/qr-code.md -->

# QR Code

A QR code generator with customizable styling, dot patterns, center overlays, and image export.

## Table of Contents

- [Properties](#properties)
- [Methods](#methods)
- [CSS Custom Properties](#css-custom-properties)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Accessibility](#accessibility)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `value` | `string` | `''` | Data to encode |
| `size` | `number` | `200` | QR code size in pixels |
| `errorCorrectionLevel` (attr: `error-correction-level`) | `'L' \| 'M' \| 'Q' \| 'H'` | `'M'` | Error correction level |
| `renderMode` (attr: `render-mode`) | `'canvas' \| 'svg'` | `'canvas'` | Rendering mode |
| `dotStyle` (attr: `dot-style`) | `'square' \| 'rounded' \| 'dots'` | `'square'` | Module shape style |
| `margin` | `number` | `4` | Quiet zone size in modules |
| `fgColor` (attr: `fg-color`) | `string` | `'#000000'` | Foreground color |
| `bgColor` (attr: `bg-color`) | `string` | `'#ffffff'` | Background color |
| `includeImage` (attr: `include-image`) | `boolean` | `false` | Show center image overlay |
| `imageUrl` (attr: `image-url`) | `string` | `''` | Center image URL |
| `imageSize` (attr: `image-size`) | `number` | `40` | Center image size in pixels |
| `centerText` (attr: `center-text`) | `string` | `''` | Center overlay text |
| `centerTextSize` (attr: `center-text-size`) | `number` | `16` | Center text font size in pixels |
| `textFillColor` (attr: `text-fill-color`) | `string` | `'#000000'` | Center text fill color |
| `textOutlineColor` (attr: `text-outline-color`) | `string` | `'#ffffff'` | Center text outline color |

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `toSVGString()` | — | Returns SVG markup string (sync, only works when `renderMode` is `'svg'`) |
| `toDataURL()` | `type?: 'image/png' \| 'image/jpeg' \| 'image/webp' \| 'image/svg+xml', quality?: number` | Export as data URL (async) |
| `toBlob()` | `type?: 'image/png' \| 'image/jpeg' \| 'image/webp' \| 'image/svg+xml', quality?: number` | Export as Blob (async) |
| `download()` | `filename?: string` | Download as image file (defaults to `'qr-code.png'`) |

## CSS Custom Properties

| Property | Description | Default |
|----------|-------------|---------|
| `--qr-bg` | Container background color | `hsl(0 0% 100%)` |
| `--qr-border-radius` | Container border radius | `0` |
| `--qr-padding` | Container padding | `0` |

## CSS Parts

| Part | Description |
|------|-------------|
| `base` | The container div holding the generated canvas or SVG |

```css
snice-qr-code::part(base) {
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
```

## Basic Usage

```typescript
import 'snice/components/qr-code/snice-qr-code';
```

```html
<snice-qr-code value="https://example.com"></snice-qr-code>
```

## Examples

### Custom Size

Use the `size` attribute to set the QR code dimensions in pixels.

```html
<snice-qr-code value="https://example.com" size="300"></snice-qr-code>
```

### Custom Colors

Use `fg-color` and `bg-color` to customize the QR code colors.

```html
<snice-qr-code value="https://example.com" fg-color="#2196f3" bg-color="#e3f2fd"></snice-qr-code>
```

### Dot Styles

Use the `dot-style` attribute to change the module shape.

```html
<snice-qr-code value="https://example.com" dot-style="square"></snice-qr-code>
<snice-qr-code value="https://example.com" dot-style="rounded"></snice-qr-code>
<snice-qr-code value="https://example.com" dot-style="dots"></snice-qr-code>
```

### Error Correction

Use `error-correction-level` for higher resilience to damage. Use `'H'` when adding center overlays.

```html
<snice-qr-code value="Important Data" error-correction-level="H"></snice-qr-code>
```

### Render Mode

Use `render-mode` to switch between canvas and SVG rendering.

```html
<snice-qr-code value="https://example.com" render-mode="svg"></snice-qr-code>
```

### Center Image

Use `include-image` with `image-url` to overlay a logo in the center. Pair with high error correction.

```html
<snice-qr-code
  value="https://example.com"
  include-image
  image-url="/logo.png"
  image-size="50"
  error-correction-level="H">
</snice-qr-code>
```

### Center Text

Use `center-text` to overlay text in the center of the QR code.

```html
<snice-qr-code
  value="https://example.com"
  center-text="SCAN"
  center-text-size="14"
  error-correction-level="H">
</snice-qr-code>
```

### Export

Use the export methods to save or share the QR code programmatically.

```typescript
const qr = document.querySelector('snice-qr-code');

// Data URL
const dataURL = await qr.toDataURL('image/png');

// Blob
const blob = await qr.toBlob('image/png');

// Download
qr.download('my-qr-code.png');

// SVG string (only when render-mode="svg")
const svgMarkup = qr.toSVGString();
```

### Common Data Formats

Set `value` to standard URI schemes for common QR code use cases.

```html
<!-- URL -->
<snice-qr-code value="https://example.com"></snice-qr-code>

<!-- Email -->
<snice-qr-code value="mailto:contact@example.com"></snice-qr-code>

<!-- Phone -->
<snice-qr-code value="tel:+1234567890"></snice-qr-code>

<!-- WiFi -->
<snice-qr-code value="WIFI:T:WPA;S:MyNetwork;P:password123;;"></snice-qr-code>

<!-- Location -->
<snice-qr-code value="geo:37.7749,-122.4194"></snice-qr-code>
```

## Accessibility

- The QR code renders as a `<canvas>` or `<svg>` element inside a container div
- No interactive elements; the component is purely visual output
- Provide adjacent text or an `aria-label` on a wrapper for screen reader users to understand the encoded content

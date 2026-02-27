[//]: # (AI: For a low-token version of this doc, use docs/ai/components/qr-code.md instead)

# QR Code
`<snice-qr-code>`

A QR code generator with customizable styling, dot patterns, and image export.

## Basic Usage

```typescript
import 'snice/components/qr-code/snice-qr-code';
```

```html
<snice-qr-code value="https://example.com"></snice-qr-code>
```

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/qr-code/snice-qr-code';
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-qr-code.min.js"></script>
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

Use `error-correction-level` for higher resilience to damage.

```html
<snice-qr-code value="Important Data" error-correction-level="H"></snice-qr-code>
```

### Render Mode

Use `render-mode` to switch between SVG and canvas rendering.

```html
<snice-qr-code value="https://example.com" render-mode="canvas"></snice-qr-code>
<snice-qr-code value="https://example.com" render-mode="svg"></snice-qr-code>
```

### Center Image

Use `include-image` with `image-url` to overlay a logo in the center.

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

### Common Data Formats

```html
<!-- URL -->
<snice-qr-code value="https://example.com"></snice-qr-code>

<!-- Email -->
<snice-qr-code value="mailto:contact@example.com"></snice-qr-code>

<!-- Phone -->
<snice-qr-code value="tel:+1234567890"></snice-qr-code>

<!-- SMS -->
<snice-qr-code value="sms:+1234567890?body=Hello"></snice-qr-code>

<!-- WiFi -->
<snice-qr-code value="WIFI:T:WPA;S:MyNetwork;P:password123;;"></snice-qr-code>

<!-- Location -->
<snice-qr-code value="geo:37.7749,-122.4194"></snice-qr-code>
```

### Export

```typescript
const qr = document.querySelector('snice-qr-code');

// Data URL
const dataURL = await qr.toDataURL('image/png');

// Blob
const blob = await qr.toBlob('image/png');

// Download
qr.download('my-qr-code.png');
```

### Dynamic Updates

```html
<input type="text" id="qrInput" placeholder="Enter text">
<snice-qr-code id="qr"></snice-qr-code>

<script type="module">
  import 'snice/components/qr-code/snice-qr-code';

  document.getElementById('qrInput').addEventListener('input', (e) => {
    document.getElementById('qr').value = e.target.value;
  });
</script>
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `value` | `string` | `''` | Data to encode |
| `size` | `number` | `200` | QR code size in pixels |
| `errorCorrectionLevel` (attr: `error-correction-level`) | `'L' \| 'M' \| 'Q' \| 'H'` | `'M'` | Error correction level |
| `renderMode` (attr: `render-mode`) | `'canvas' \| 'svg'` | `'svg'` | Rendering mode |
| `dotStyle` (attr: `dot-style`) | `'square' \| 'rounded' \| 'dots'` | `'square'` | Module shape style |
| `margin` | `number` | `4` | Quiet zone size |
| `fgColor` (attr: `fg-color`) | `string` | `'#000000'` | Foreground color |
| `bgColor` (attr: `bg-color`) | `string` | `'#ffffff'` | Background color |
| `includeImage` (attr: `include-image`) | `boolean` | `false` | Show center image |
| `imageUrl` (attr: `image-url`) | `string` | `''` | Center image URL |
| `imageSize` (attr: `image-size`) | `number` | `40` | Center image size |
| `centerText` (attr: `center-text`) | `string` | `''` | Center overlay text |
| `centerTextSize` (attr: `center-text-size`) | `number` | `16` | Center text font size |
| `textFillColor` (attr: `text-fill-color`) | `string` | `'#000000'` | Center text fill color |
| `textOutlineColor` (attr: `text-outline-color`) | `string` | `'#ffffff'` | Center text outline color |

## CSS Parts

Style internal elements from outside the shadow DOM using `::part()`.

| Part | Element | Description |
|------|---------|-------------|
| `base` | `<div>` | QR code container holding the generated canvas or SVG |

```css
snice-qr-code::part(base) {
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
```

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `toDataURL()` | `type?: string, quality?: number` | Export as data URL (async) |
| `toBlob()` | `type?: string, quality?: number` | Export as Blob (async) |
| `download()` | `filename?: string` | Download as image file |

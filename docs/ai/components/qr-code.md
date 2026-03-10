# snice-qr-code

QR code generator with customizable styling, center overlays, and export.

## Properties

```typescript
value: string = '';
size: number = 200;
errorCorrectionLevel: 'L'|'M'|'Q'|'H' = 'M';  // attr: error-correction-level
renderMode: 'canvas'|'svg' = 'canvas';           // attr: render-mode
dotStyle: 'square'|'rounded'|'dots' = 'square';  // attr: dot-style
margin: number = 4;
fgColor: string = '#000000';                      // attr: fg-color
bgColor: string = '#ffffff';                      // attr: bg-color
includeImage: boolean = false;                    // attr: include-image
imageUrl: string = '';                            // attr: image-url
imageSize: number = 40;                           // attr: image-size
centerText: string = '';                          // attr: center-text
centerTextSize: number = 16;                      // attr: center-text-size
textFillColor: string = '#000000';                // attr: text-fill-color
textOutlineColor: string = '#ffffff';             // attr: text-outline-color
```

## Methods

- `toSVGString()` - SVG markup string (sync, only when renderMode='svg')
- `toDataURL(type?, quality?)` - Export as data URL (async)
- `toBlob(type?, quality?)` - Export as Blob (async)
- `download(filename?)` - Download as image file

## CSS Custom Properties

- `--qr-bg` - Container background (`hsl(0 0% 100%)`)
- `--qr-border-radius` - Container border radius (`0`)
- `--qr-padding` - Container padding (`0`)

## CSS Parts

- `base` - QR code container div

## Basic Usage

```html
<snice-qr-code value="https://example.com"></snice-qr-code>

<!-- Custom colors + dot style -->
<snice-qr-code value="https://example.com" fg-color="#2196f3" dot-style="rounded"></snice-qr-code>

<!-- Center image overlay (use high error correction) -->
<snice-qr-code value="https://example.com" include-image image-url="/logo.png" error-correction-level="H"></snice-qr-code>

<!-- Center text overlay -->
<snice-qr-code value="https://example.com" center-text="SCAN" error-correction-level="H"></snice-qr-code>

<!-- SVG render mode -->
<snice-qr-code value="https://example.com" render-mode="svg"></snice-qr-code>
```

```typescript
const qr = document.querySelector('snice-qr-code');
const url = await qr.toDataURL('image/png');
const blob = await qr.toBlob('image/png');
qr.download('qr-code.png');
const svg = qr.toSVGString(); // only when renderMode='svg'
```

## Accessibility

- Purely visual output, no interactive elements
- Provide adjacent text or wrapper `aria-label` for screen readers

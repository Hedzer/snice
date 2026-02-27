# snice-qr-code

QR code generator with customizable styling and export.

## Properties

```typescript
value: string = '';
size: number = 200;
errorCorrectionLevel: 'L'|'M'|'Q'|'H' = 'M';  // attr: error-correction-level
renderMode: 'canvas'|'svg' = 'svg';              // attr: render-mode
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

- `toDataURL(type?, quality?)` - Export as data URL (async)
- `toBlob(type?, quality?)` - Export as Blob (async)
- `download(filename?)` - Download as image file

## Usage

```html
<snice-qr-code value="https://example.com" size="250"></snice-qr-code>

<!-- Custom colors -->
<snice-qr-code value="https://example.com" fg-color="#2196f3" bg-color="#e3f2fd"></snice-qr-code>

<!-- With center image -->
<snice-qr-code value="https://example.com" include-image image-url="/logo.png" error-correction-level="H"></snice-qr-code>

<!-- Dot styles -->
<snice-qr-code value="https://example.com" dot-style="rounded"></snice-qr-code>
```

```typescript
const qr = document.querySelector('snice-qr-code');
qr.value = 'https://example.com';
const url = await qr.toDataURL('image/png');
const blob = await qr.toBlob('image/png');
qr.download('qr-code.png');
```

**CSS Parts:**
- `base` - QR code container div

## Common Data Formats

```typescript
// URL:   'https://example.com'
// Email: 'mailto:name@example.com'
// Phone: 'tel:+1234567890'
// SMS:   'sms:+1234567890?body=Hello'
// WiFi:  'WIFI:T:WPA;S:NetworkName;P:password;;'
// Geo:   'geo:37.7749,-122.4194'
// vCard: 'BEGIN:VCARD\nVERSION:3.0\nFN:Name\nEND:VCARD'
```
